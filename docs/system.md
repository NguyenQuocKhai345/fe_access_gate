system.md — Project Context: TMC-AACS (C05–C09)
Tài liệu bối cảnh chung cho toàn bộ thành viên và AI coding agents tham gia triển khai M2.
Phạm vi dự án được nhóm chọn triển khai trong M2: C05–C09.
Tài liệu mô tả mục tiêu, nghiệp vụ, kiến trúc, ranh giới thành phần, luồng tích hợp và các quy tắc chung. Không gán module cho một cá nhân cụ thể.
Nguồn nền: báo cáo kiến trúc M1 (BTL_KTPM) và phạm vi Assignment M2; những quyết định triển khai M2 mới nhất của nhóm được ưu tiên khi khác với phương án kiến trúc ban đầu trong M1.

1. Tổng quan dự án
1.1 Bối cảnh nghiệp vụ
Công ty Cổ phần Sản xuất TMC có hai nhà máy:
- Bình Dương: khoảng 800 nhân viên.
- Long An: khoảng 600 nhân viên.
- Tổng quy mô: khoảng 1.400 nhân viên.
TMC cần hệ thống chấm công và kiểm soát ra vào bằng QR Code. Nhân viên sử dụng ứng dụng di động, cổng web hoặc kênh được công ty hỗ trợ để hiển thị QR. Tại cổng, kiosk/máy quét đọc QR, hệ thống xác minh credential và quyền ra/vào. Nếu được phép, hệ thống gửi lệnh tới Turnstile Control System. Lượt quét và kết quả xử lý được ghi nhận để làm dữ liệu chấm công và đối soát.
1.2 Hệ thống bên ngoài
1. HR/Payroll: nhận dữ liệu chấm công để đối soát và xử lý nhân sự/tiền lương. Hệ thống TMC-AACS không thay thế HR/Payroll và không tự tính lương.
2. Turnstile Control System: hệ thống/controller bên ngoài có API điều khiển cổng quay. Ứng dụng gửi command; thiết bị/controller chịu trách nhiệm tác động cơ khí.
3. Kiosk / QR scanner: thiết bị tại trạm cổng nhận QR và gửi scan request đến hệ thống edge.
1.3 Mục tiêu nghiệp vụ
- Chỉ cho phép điều khiển mở cổng khi QR/credential hợp lệ và policy cho phép.
- Nhận diện và từ chối credential không hợp lệ, hết hạn, sai đối tượng/issuer/audience hoặc bị replay theo quy tắc.
- Ghi nhận lượt quét, quyết định truy cập, intent điều khiển và outcome có khả năng truy vết.
- Không mất dữ liệu scan đã được commit trong điều kiện vận hành bình thường.
- Kiosk phản hồi mục tiêu không quá 2 giây ở tải tham chiếu khoảng 800 giao dịch/30 phút/nhà máy; cần đo/kiểm chứng, không mặc định đạt.
- Đường quét tại nhà máy không phụ thuộc kết nối WAN/central.
- Có khả năng thay đổi adapter hoặc controller mà không làm thay đổi logic nghiệp vụ cốt lõi.
1.4 Ngoài phạm vi
Không triển khai quản lý khách thăm, tính lương, điều khiển cơ khí cổng quay, hoặc thay thế HR/Payroll. Các module C05–C09 không được tự mở rộng sang các nghiệp vụ này.
2. Kiến trúc và công nghệ triển khai M2
2.1 Quyết định triển khai
M1 trình bày kiến trúc tổng thể gồm central và edge. Code hiện tại dùng Java Spring Boot và nhiều service độc lập. Repository có 7 service nghiệp vụ: `identity-user-service`, `qr-service`, `gate-station-service`, `access-event-service`, `attendance-report-service`, `hr-integration-service` và `audit-notification-service`; cùng 3 service hạ tầng: `api-gateway`, `config-server` và `discovery-server`.

Các nhãn C05–C09 bên dưới là capability nghiệp vụ, không phải ánh xạ một-một sang service đang chạy. `access-event-service` nhận request scan, phối hợp kiểm tra, lưu quyết định/command và ghi nhận confirmation; `qr-service` xác minh, cấp và thu hồi QR; `identity-user-service` quản lý danh tính/thiết bị và kiểm tra quyền; `gate-station-service` quản lý trạm. C09 demo hiện là adapter `GateSimulator` nằm trong `access-event-service`, không phải service riêng và không điều khiển cổng vật lý. Ba service mới bổ sung xử lý attendance/report, tích hợp HR/Payroll và audit/notification như mô tả dưới đây.

Các service nghiệp vụ và cổng mặc định được README cấu hình như sau: identity 8081, QR 8082, station 8083, access event 8084, attendance/report 8085, HR integration 8086, audit/notification 8087; Gateway 8080, Discovery 8761 và Config 8888. `audit-notification-service` dùng MongoDB; các service nghiệp vụ còn lại dùng PostgreSQL riêng theo cấu hình. Đây là cấu hình chạy trong repository, có thể được override theo môi trường.

Ba service nghiệp vụ bổ sung hiện có:
- `attendance-report-service`: nhận passage event nội bộ; tổng hợp thời gian làm việc và ngoại lệ theo kỳ/factory; cho phép đề xuất và duyệt điều chỉnh với người duyệt độc lập; chốt kỳ thành snapshot có revision/checksum và cung cấp snapshot cho luồng export. Service xử lý idempotency của event và không tự tạo scan evidence thay `access-event-service`.
- `hr-integration-service`: nhận yêu cầu export theo `factoryId` và `snapshotId`, kiểm tra snapshot đã chốt, tạo batch gửi dữ liệu sang hệ thống HR/Payroll bên ngoài, theo dõi receipt/reconciliation, retry có điều kiện và giám sát deadline. Khi lỗi truyền tải khiến kết quả không rõ, batch được giữ trạng thái cần xác minh thay vì gửi lại mù.
- `audit-notification-service`: lưu/đọc audit và notification; tiếp nhận event để tạo audit record/cảnh báo. API đọc yêu cầu scope `audit.read`; quyền xem toàn cục và theo factory được kiểm tra qua identity.

Gateway hiện chỉ cấu hình route cho Identity, QR, Stations và Access (`/api/identity/**`, `/api/qr/**`, `/api/stations/**`, `/api/access/**`). Chưa có route Gateway cho Attendance, HR hoặc Audit; các endpoint của ba service mới không nên được mô tả như đã truy cập được qua Gateway.

Mỗi service sở hữu dữ liệu và logic thuộc trách nhiệm của nó. Việc các service chạy cùng máy, cùng Docker network hoặc dùng chung một database server (nếu được lựa chọn cho môi trường development) không có nghĩa được phép join/ghi chéo dữ liệu tùy ý. Giao tiếp xuyên service phải thông qua contract.
2.2 Edge và central
- Luồng scan hiện gọi đồng bộ từ `access-event-service` tới các API nội bộ của identity, station và QR khi tích hợp nội bộ được bật. Chưa có snapshot/offline fallback thể hiện trong code; do đó hoạt động scan độc lập với WAN/central hiện là mục tiêu kiến trúc, chưa phải đặc tính đã được code chứng minh.
- Các chức năng ngoài đường quét trực tiếp hiện có implementation ở `attendance-report-service` (tổng hợp attendance và chốt snapshot), `hr-integration-service` (export snapshot sang HR/Payroll), và `audit-notification-service` (audit/notification). Các luồng này là hậu xử lý/central, không nằm trong synchronous scan path.
- Attendance nhận passage event nội bộ; HR export lấy snapshot đã chốt từ Attendance; Audit/Notification nhận event riêng. Không suy ra rằng toàn bộ ba service đã được expose qua Gateway hoặc mọi môi trường đã bật broker/đối tác ngoài.
- C10/C11 và các thành phần central khác không được gửi lệnh mở cổng thay C09.
- Trong phạm vi M2, nhóm tập trung triển khai C05–C09. Những module ngoài phạm vi này chỉ được nhắc để giải thích dependency/context, không tự ý xây thêm.
2.3 Quy tắc triển khai microservice
- Mỗi service có API và cấu hình riêng; ranh giới capability C05–C09 chưa ánh xạ một-một sang service, và ba service attendance/HR/audit là các capability ngoài C05–C09.
- Không gọi trực tiếp class nội bộ của service khác.
- Không truy cập database của service khác; không cross-service join.
- Giao tiếp đồng bộ dùng API khi use case cần phản hồi trực tiếp; các tác vụ hậu xử lý/sync không nên bị kéo vào đường găng.
- Các luồng hậu xử lý hiện dùng event/broker và API theo từng contract: `attendance-report-service` nhận passage event; `hr-integration-service` đọc snapshot qua API Attendance và gửi tới HR/Payroll; `audit-notification-service` xử lý audit/notification event.
- Contract cần có định danh request/scan và xử lý duplicate phù hợp.
- Cấu hình môi trường (URL, secret, timeout, feature/profile) không hard-code trong source.
- API, DTO, enum và semantics lỗi phải thống nhất giữa các thành viên trước khi tích hợp.
- Không tự thay đổi stack/version/library hoặc contract đã được nhóm thống nhất nếu không trao đổi trước.
3. Phạm vi C05–C09 và trách nhiệm các service
3.1 C05 — Scan Endpoint / ScanHandler (capability nằm trong `access-event-service`)
Mục đích: điểm tiếp nhận scan và điều phối xử lý trong `access-event-service`, không phải service C05 độc lập.

Trách nhiệm:
- Nhận scan request từ kiosk/scan adapter.
- Xác thực danh tính thiết bị kiosk và request theo cơ chế hệ thống.
- Nhận/duy trì scan_id để định danh và chống xử lý trùng.
- Gọi lớp `AccessPolicy` để phối hợp kiểm tra thiết bị/trạm, QR và quyền nhân viên; áp dụng kiểm tra hết hạn/replay, lưu quyết định và tạo command khi ALLOW.
- Trả quyết định scan cùng `commandId` và hạn command khi được phép; endpoint scan hiện không gọi controller hoặc Simulator.
- Trả kết quả scan phù hợp cho kiosk/client.
- Phối hợp các service qua API/contract; không nhúng logic riêng của C06/C07/C08/C09 vào ScanHandler.
- Không chứa mã SQL hoặc logic controller/device integration trực tiếp.
Không thuộc C05:
- Tự xác minh đầy đủ chữ ký/credential thay C06.
- Tự quyết định access policy thay C07.
- Tự quản lý transaction và schema của C08.
- Tự gọi controller/simulator bypass C09.
C05 là capability được thực hiện trong `access-event-service`. Xác minh QR, dữ liệu identity/trạm và persistence được phân công sang service/repository tương ứng; điều khiển cổng chưa được hiện thực trong repository.
3.2 C06 — QR Verifier (`qr-service`)
Mục đích: xác minh tính hợp lệ và tin cậy của QR/credential trước khi đánh giá quyền truy cập.

Trách nhiệm tối thiểu theo kiến trúc:
- Kiểm tra chữ ký hoặc cơ chế xác minh credential theo contract.
- Kiểm tra issuer, audience, thời hạn, key identifier và các claim cần thiết.
- Phát hiện credential không hợp lệ/hết hạn hoặc các điều kiện credential verification thất bại.
- Xác minh JWT ký RS256, `kid`, issuer, audience, purpose, version, thời hạn, factory và trạng thái QR lưu trong store.
- Cấp QR có thời hạn cấu hình từ 30 đến 60 giây và hỗ trợ thu hồi qua API người dùng; do đó code hiện tại có cả chức năng cấp/thu hồi QR.
- Việc xác minh phụ thuộc service và store; chưa thấy key/policy snapshot để xác minh offline.
- Trả kết quả xác minh có nghĩa để C05 phối hợp C07.
Không thuộc C06:
- Quyết định người dùng được phép vào nhà máy hay không.
- Ghi nhận attendance transaction.
- Gửi command điều khiển cổng.
Phân biệt rõ credential hợp lệ với được phép truy cập: credential có thể xác minh hợp lệ nhưng policy vẫn có thể từ chối.
3.3 C07 — Access Policy (đang được phối hợp trong `access-event-service`)
Mục đích: quyết định quyền ra/vào dựa trên credential đã được xác minh và chính sách có hiệu lực.

Trách nhiệm:
- Đánh giá quyền nhà máy/trạm và trạng thái liên quan.
- Nhận dữ liệu trạm, QR và quyền nhân viên qua `RemoteAccessPolicy`; `identity-user-service` hiện kiểm tra nhân viên active và quyền theo factory, còn `gate-station-service` kiểm tra trạm/thiết bị.
- Kiểm tra quyền hiện tại dựa trên trạng thái nhân viên và factory; duplicate scan được xử lý tại `access-event-service`, còn QR replay được redeem trong persistence của service này sau xác minh QR.
- Chưa có snapshot/offline policy thể hiện trong code.
- Trả quyết định rõ ràng ALLOW hoặc DENY, kèm reason code phù hợp để C05 xử lý.
- Không tự thực hiện side effect mở cổng.
Không thuộc C07:
- Xác minh mật mã QR thay C06.
- Tạo attendance event/intent/outbox thay C08.
- Gọi controller hoặc simulator thay C09.
- Truy cập trực tiếp HR/central trong đường quét.
C06 trả lời “credential có hợp lệ không”; C07 trả lời “credential/đối tượng này có được phép thực hiện hành động tại trạm này không”.
3.4 C08 — Access Event / Command Persistence (trong `access-event-service`)
Mục đích: lưu bền bằng chứng scan, quyết định, command và dữ liệu cần cho recovery theo transaction nhất quán.

Trách nhiệm:
- Ghi AccessEvent/scan evidence và status history theo schema/contract.
- Khi quyết định ALLOW, ghi `gate_commands` với `commandId`, hạn và trạng thái ban đầu `PENDING`; code chưa có entity/luồng GateIntent chuyển command cho C09 thực thi.
- Ghi outbox event phục vụ đồng bộ.
- Commit scan decision + command (nếu ALLOW) + access event + outbox liên quan trong một transaction nguyên tử.
- Cung cấp endpoint nhận confirmation theo `commandId`; service cập nhật outcome và ghi evidence/event/outbox.
- Hỗ trợ truy vết/recovery bằng scan_id, command_id và các định danh liên quan.
- Không làm mất evidence đã commit chỉ vì lời gọi controller gặp lỗi.
Không thuộc C08:
- Xác minh QR.
- Quyết định policy.
- Điều khiển thiết bị trực tiếp.
- Gửi dữ liệu đồng bộ central thay worker/module sở hữu việc đó.
Trong code hiện tại, scan method được đánh dấu transaction; các lời gọi API nội bộ để kiểm tra cũng diễn ra trong lúc xử lý method này. Quyết định scan, command (nếu ALLOW), access event và outbox được ghi trong cùng transaction. Vì vậy implementation hiện tại chưa đáp ứng nguyên tắc không giữ transaction DB mở trong lúc gọi network. Không có lời gọi controller sau commit trong luồng scan hiện tại. Confirmation đến qua endpoint riêng của service.
3.5 C09 — Gate Commander (simulator local cho demo)
Mục đích: điều khiển cổng qua một contract ổn định, cô lập khác biệt controller/vendor khỏi nghiệp vụ scan. Repository có `GateSimulator` local để trình diễn kết quả, chưa có adapter controller vật lý.

Các trách nhiệm đích trong kiến trúc gồm:
- Nhận command đã được tạo/ủy quyền từ luồng sau khi intent đã commit.
- Điều khiển cổng qua abstraction/port, không gọi API vendor trực tiếp từ C05.
- Chuyển đổi request/response thiết bị thành outcome thống nhất.
- Phân biệt:
  - Confirmed: có bằng chứng theo contract rằng thao tác đã được xác nhận.
  - Rejected: controller từ chối hoặc xác nhận thất bại.
  - Unknown: không thể xác định chắc thao tác đã xảy ra hay chưa (timeout, mất response…).
- Áp dụng timeout/deadline hữu hạn; ADR-10 dự kiến 700 ms cho lời gọi controller, cần cấu hình/kiểm chứng.
- Chỉ retry khi idempotency được controller/contract xác nhận và vẫn còn deadline.
- Giữ nguyên command_id và scan_id để truy vết/đối soát.
- Không ghi transaction attendance thuộc C08.
- Có adapter simulator cùng contract với adapter controller thật.

Implementation local hiện cung cấp `POST /api/access/simulator/scans` khi `GATE_SIMULATOR_ENABLED=true`. Endpoint chỉ cho ADMIN, gọi lại cùng luồng kiểm tra scan/policy thật, rồi ghi confirmation `OPENED` bằng adapter giả lập. Response ghi rõ `SIMULATED`; không tạo bằng chứng passage và không điều khiển phần cứng. Cờ mặc định là `false`; không bật trên môi trường production.
Không thuộc C09:
- Xác minh QR, quyết định policy hoặc điều phối toàn bộ scan use case.
- Tạo/ghi AccessEvent, GateIntent, Outbox hoặc quản lý DB C08.
- Đồng bộ central, tính công, HR/Payroll hoặc reporting.
- Điều khiển cơ khí trực tiếp ngoài API/contract controller.
3.6 Bảng trách nhiệm nhanh và ánh xạ code
Service	Câu hỏi mà service trả lời	Trách nhiệm chính
C05 Scan Endpoint	Request scan được xử lý thế nào?	`access-event-service`: nhận scan, phối hợp kiểm tra, lưu và trả quyết định
C06 QR Verifier	QR có hợp lệ không?	`qr-service`: cấp/thu hồi/xác minh QR và trạng thái QR
C07 Access Policy	Nhân viên/trạm có được phép không?	`access-event-service` phối hợp identity và gate-station; policy hiện tại là kiểm tra quyền/factory và station
C08 Event/Command Persistence	Quyết định và outcome nào được lưu?	`access-event-service`: scan, command, access event, confirmation và outbox
C09 Gate Commander	Lệnh được thiết bị xử lý ra sao?	`access-event-service`: local GateSimulator ghi confirmation mô phỏng; chưa có controller adapter vật lý


4. Luồng scan hiện có trong code
Luồng thành công khái quát:
1. Client/kiosk gửi `POST /scans` với `scanId`, `stationId`, QR token và JWT thiết bị. Endpoint kiểm tra station trong JWT khớp request.
2. Khi internal APIs được bật, `RemoteAccessPolicy` lần lượt kiểm tra device trong identity, station trong gate-station, QR trong qr-service và quyền nhân viên/factory trong identity.
3. `access-event-service` kiểm tra expiration và redeem/replay QR. Cùng scan ID và payload trả về quyết định đã lưu; cùng ID với payload khác bị từ chối.
4. Service lưu scan decision và access event; khi ALLOW, tạo `gate_commands` trạng thái `PENDING` với command ID và hạn lệnh. Event và outbox cùng transaction. Transaction hiện bao quanh cả các lời gọi API kiểm tra đồng bộ ở bước trước.
5. Endpoint trả `ScanDecisionDTO`. Luồng hiện tại không thực thi command qua controller/Simulator.
6. Confirmation/outcome có thể được gửi riêng tới `POST /commands/{commandId}/confirmations`; service xác thực station, identity confirmation, thời gian và chuyển trạng thái theo quy tắc.
7. Passage event được phát sau luồng xác nhận và được `attendance-report-service` tiếp nhận để cập nhật dữ liệu chấm công; đây là luồng hậu xử lý, không chặn response scan. Audit/notification xử lý event tương ứng độc lập.
8. Sau khi HR chốt kỳ, `attendance-report-service` tạo snapshot bất biến. `hr-integration-service` có thể nhận yêu cầu export snapshot đó sang HR/Payroll, theo dõi receipt và reconciliation; tiến trình này không thuộc scan request.

Trang **Mô phỏng cổng** dùng route riêng `POST /simulator/scans` trong `access-event-service`. Route này chỉ hoạt động khi `GATE_SIMULATOR_ENABLED=true` và ADMIN gọi bằng JWT người dùng; server kiểm tra station/device, QR, nhân viên và quyền bằng cùng policy, sau đó simulator ghi confirmation `OPENED`. FE hiển thị kết quả scan ở trạng thái riêng, lấy thông tin nhân viên/nhà máy/trạm từ response và dữ liệu danh mục đã tải; kết quả từ chối có lý do, không có gate command. Trước khi quét, ADMIN cần đăng ký thiết bị kiosk trong mục **Nhà máy & trạm** bằng đúng `deviceId` đã cấu hình cho trạm. Đây là đường demo, không thay route kiosk `POST /scans` hoặc kiểm thử xác thực JWT kiosk. Kết quả không chứng minh passage vật lý và không tạo `PASSAGE_CONFIRMED`.
4.1 Luồng deny/error
- QR verification fail: scan bị deny/error; không tạo command mở cổng.
- Policy DENY: ghi kết quả phù hợp; không gửi command.
- C08 commit fail: không gửi command; trả lỗi an toàn và cho phép recovery theo contract.
- Controller timeout/mất response: adapter controller vật lý và các kịch bản lỗi simulator chưa được triển khai; simulator local hiện chỉ chạy kịch bản `SUCCESS`.
- Lỗi một service: xử lý theo semantics và failure policy; không biến lỗi thành ALLOW/Confirmed giả.
5. Contract, data identity và semantics
5.1 Identity cần giữ xuyên luồng
- scan_id: định danh scan request, dùng trace và duplicate handling.
- command_id: định danh command điều khiển cổng, ổn định cho cùng intent.
- station_id / gate/device reference: xác định trạm/cổng cần tác động.
- Các identity khác chỉ dùng theo contract hiện hành; không tự thêm PII không cần thiết.
Các định danh cần được truyền xuyên service/API, log và outcome/reconciliation phù hợp.
5.2 Semantics outcome trong code và kiến trúc
- Enum lưu trong code là `PENDING`, `OPENED`, `FAILED`, `UNKNOWN`, `PASSED`; confirmation API nhận outcome và ghi evidence. Đây không phải enum `Confirmed/Rejected/Unknown` trong mô tả kiến trúc ban đầu.
- `OPENED` là outcome cổng mở được ghi nhận; `PASSED` ghi nhận passage confirmation. Cách thức thu thập confirmation hiện nằm ngoài luồng scan; code không có adapter/controller cung cấp chúng.
- Các định nghĩa Confirmed/Rejected/Unknown bên dưới là semantics mong muốn cho tích hợp controller tương lai, không phải tên outcome hiện dùng trong code.
Unknown không phải synonym của Failed hay Confirmed. Nếu controller hỗ trợ query trạng thái, capability này có thể dùng để reconciliation; không bắt mọi adapter phải có query.
5.3 Idempotency và duplicate
- Cùng identity/payload phải không tạo side effect lặp ngoài semantics contract.
- Cùng identity nhưng payload khác phải bị phát hiện và từ chối.
- Retry không được tạo command identity mới cho cùng intent.
- Mỗi service áp dụng duplicate handling cho responsibility của mình; không dựa vào một service để che duplicate ở tất cả lớp.
6. Persistence, consistency và recovery
6.1 Persistence và recovery hiện có
`access-event-service` lưu scan decision, command khi ALLOW, access event và outbox trong transaction. Transaction scan hiện cũng bao quanh các lời gọi kiểm tra API nội bộ; đây là khác biệt so với nguyên tắc thiết kế ban đầu không giữ transaction mở trong lúc gọi network. Scan hiện không gọi controller sau commit, nên các tình huống recovery của controller dưới đây chưa có implementation tích hợp.
- Cùng scan ID và payload được nhận lại: trả quyết định đã lưu; payload khác bị conflict.
- Confirmation được gửi riêng theo command ID; confirmation ID/payload trùng được xử lý idempotent, dữ liệu mâu thuẫn bị từ chối.
- Confirmation muộn có thể được lưu để review thay vì ghi đè trạng thái hiện hành.
- Không suy diễn kết quả controller trong trường hợp timeout vì code hiện chưa gọi controller.
6.2 Event evidence và projection
AccessEvent và confirmation là evidence được ghi trong `access-event-service`. Code lưu các event `GATE_*` và `PASSAGE_CONFIRMED`; không thể kết luận passage vật lý chỉ từ kết quả điều khiển nếu không có sensor/bằng chứng passage tương ứng. `attendance-report-service` nhận `PASSAGE_CONFIRMED` làm dữ liệu đầu vào để tổng hợp; các adjustment đã duyệt và snapshot được lưu tại service này. `audit-notification-service` lưu audit record/notification từ các event liên quan. Đây là dữ liệu/projection thuộc service tương ứng, không phải cơ sở dữ liệu dùng chung.

`attendance-report-service` hỗ trợ đọc tổng hợp theo factory/kỳ và dữ liệu của chính nhân viên; điều chỉnh phải được HR/Supervisor đề xuất theo quyền, HR khác người đề xuất phải quyết định, và chốt kỳ yêu cầu kỳ đã kết thúc cùng revision kỳ vọng. Snapshot đã chốt có revision và checksum để phục vụ export/reconciliation.

`hr-integration-service` kiểm tra snapshot có thể export, bảo đảm idempotency theo snapshot, quản lý batch/receipt và trạng thái đối soát. Deadline được tính theo cấu hình/múi giờ ứng dụng; retry chỉ áp dụng cho trạng thái cho phép. Nếu request gửi sang đối tác bị timeout, service tra cứu theo idempotency trước khi quyết định gửi lại. Đây là tích hợp với hệ thống HR/Payroll bên ngoài; service không tính lương.

`audit-notification-service` hỗ trợ truy vấn audit theo trang và notification theo factory/giới hạn phân trang; quyền đọc do scope và authorization theo factory kiểm soát. Các loại cảnh báo được phát sinh từ event/monitor trong code; không nên coi nội dung notification là quyết định cấp quyền truy cập.
7. Gate Simulator — adapter local trong `access-event-service`
Simulator không phải service riêng, controller adapter vật lý hay bằng chứng passage. Các phần state machine/kịch bản dưới đây mô tả mục tiêu mở rộng; implementation local hiện chỉ chạy kịch bản `SUCCESS` và giữ trạng thái mở trong bộ nhớ theo thời lượng cấu hình.
7.1 State machine
Luồng mô phỏng thành công tham khảo:

CLOSED → OPENING → OPEN → CLOSING → CLOSED

Chỉ cần state và timestamp; không cần mô phỏng cơ khí, cảm biến hay chuyển động thật. Khi command mở được áp dụng, Simulator giữ trạng thái OPEN trong khoảng cấu hình (ví dụ 3 giây), rồi tự đóng.
7.2 Các kịch bản demo/test
- SUCCESS: command được áp dụng và trả confirmation theo contract.
- REJECTED: controller giả lập từ chối, có reason.
- DELAY/TIMEOUT: response chậm vượt deadline C09.
- APPLIED_BUT_RESPONSE_LOST: trạng thái/tác động đã được ghi nhận nhưng response bị mất/treo.
- ACCEPTED_ONLY: đã nhận/xếp hàng command, chưa xác nhận cổng mở.
Kịch bản phải tái lập và được chọn qua profile/configuration hoặc cơ chế demo/test được bảo vệ; không để client không tin cậy tự chọn outcome trong môi trường production.
7.3 Hai loại thời gian không được nhầm
1. controllerTimeout/deadline (ADR-10 dự kiến 700 ms): giới hạn thời gian C09 chờ response từ simulator/controller.
2. openDuration (ví dụ 3 giây): thời gian Simulator giữ gate ở OPEN trước khi tự đóng.
Simulator xác nhận trạng thái mở trong ngân sách response nếu kịch bản success; tác vụ tự đóng diễn ra độc lập, không bắt C09 giữ request đến hết openDuration.

Với APPLIED_BUT_RESPONSE_LOST, Simulator phải ghi nhận tác động trước khi mất response. C09 trả Unknown khi hết deadline mà không có evidence; có thể query/reconcile bằng command_id nếu Simulator contract hỗ trợ.

Cùng command_id/payload không được gây tác động mô phỏng lặp; cùng ID nhưng payload khác phải từ chối.

Có thể cung cấp endpoint health, command status và gate state để demo/test. UI dashboard chỉ là tùy chọn; API và state machine mới là phần cốt lõi.
8. Quy tắc chung cho cả C05–C09
8.1 Security
- Xác thực kiosk/service request theo cơ chế đã thống nhất.
- Không tin request từ client chỉ vì nó gọi đúng endpoint.
- Credential/QR không hợp lệ không được đi tiếp thành command mở cổng.
- Không log raw QR, secret, token hoặc PII không cần thiết.
- Secrets và key material lấy từ cấu hình an toàn, không commit vào repo.
- Failure không được tự động biến thành ALLOW hoặc Confirmed.
- Cơ chế safety/emergency vật lý không phụ thuộc ứng dụng.
8.2 Reliability và latency
- Đường scan không chờ HR, report, central hoặc tác vụ sync.
- Mọi network I/O trong đường găng phải có timeout/deadline hữu hạn.
- Không retry mù các thao tác có side effect.
- Không giữ transaction DB trong network call.
- Mục tiêu scan response ≤ 2 giây là NFR cần test/đo trên môi trường phù hợp.
- Timeout controller 700 ms là dự kiến theo ADR-10; phải cấu hình và kiểm chứng, không hard-code rải rác.
8.3 Observability
- Dùng correlation/trace identity xuyên request, tối thiểu scan_id, command_id khi có.
- Log có cấu trúc, đủ chẩn đoán trạng thái và lỗi nhưng không lộ credential/PII.
- Có health/readiness phù hợp cho service.
- Các lỗi external dependency phải có semantics rõ; không chỉ log rồi trả success.
8.4 Contract-first collaboration
- API path, DTO, enum, error codes, authentication, timeout, idempotency và response semantics cần được nhóm thống nhất.
- Khi sửa contract, cập nhật tài liệu/API spec và thông báo cho các service phụ thuộc.
- Không tự đoán contract của service khác khi source/assignment chưa xác định.
- Nếu contract chưa rõ, agent phải nêu assumptions và hỏi/đề xuất trước khi triển khai behavior ảnh hưởng tích hợp.
9. Kiểm thử
Repository có unit/service/integration tests cho một số luồng, nhưng danh sách sau là phạm vi cần đối chiếu khi phát triển; không mặc định toàn bộ đã có hoặc đã đạt:
- C05: request validation/auth kiosk, orchestration đúng thứ tự, duplicate scan handling, response mapping.
- C06: credential hợp lệ/invalid, signature, issuer/audience, expiration/key, replay cases theo contract.
- C07: allow/deny theo quyền nhân viên/factory và station; snapshot/offline chưa có trong code.
- C08: atomic persistence event + command + outbox; duplicate scan, confirmation và review evidence.
- C09: local simulator kiểm chứng scan allow → confirmation `OPENED (SIMULATED)`; controller vật lý, `REJECTED`, `DELAY/TIMEOUT` và `APPLIED_BUT_RESPONSE_LOST` chưa được triển khai.
- End-to-end: QR invalid không tạo command; policy deny không tạo command; identity trace qua scan/command/outcome.
- Test microservice contract không yêu cầu service khác truy cập database nội bộ.
10. Hướng dẫn AI agent khi đọc context
- Đây là project context chung cho C05–C09; không giả định người đang code chỉ phụ trách C09.
- Trước khi sửa code, xác định service/module task đang làm, đọc repository, API contracts, README, build files, configuration và tests.
- M1 mô tả kiến trúc nền; triển khai M2 theo quyết định Microservices + Java Spring Boot mới nhất của nhóm.
- Chỉ sửa service/task được yêu cầu và phần liên quan tối thiểu; không tự tiện refactor các service khác.
- Không tạo thêm module/service ngoài các thành phần đã có và phạm vi task được yêu cầu; repository hiện đã có `attendance-report-service`, `hr-integration-service` và `audit-notification-service` bên cạnh C05–C09.
- Không tự bịa contract, database schema, controller API, policy rule, token claims hoặc semantics retry.
- Khi cần tích hợp nhiều service, làm rõ contract trước, đề xuất thay đổi nhỏ và nêu rõ tác động tới các thành viên khác.
- Các quy tắc code chi tiết (SOLID, layering, naming, testing, git/change scope...) nằm trong agent.md; tài liệu này cung cấp project context và semantics nghiệp vụ/kiến trúc.
11. Definition of Done — phạm vi M2 C05–C09
Một service/task được xem là hoàn thành khi:
- Đúng responsibility và không bypass service ownership.
- API/contract được thống nhất, tài liệu và implementation nhất quán.
- Luồng chính và các lỗi quan trọng có tests.
- Không truy cập database nội bộ service khác.
- Không làm lộ secret/credential/PII qua log hoặc response.
- Có cấu hình môi trường và hướng dẫn chạy/test.
- Tích hợp với service phụ thuộc qua contract được kiểm tra.
- Các yêu cầu reliability/security liên quan được test hoặc ghi rõ limitation.
- Không tuyên bố đạt NFR chỉ dựa trên code; có evidence test/measurement phù hợp.
