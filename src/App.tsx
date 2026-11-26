import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, Building2, ClipboardList, DoorOpen, FileClock, Fingerprint, KeyRound, LogOut, Menu, QrCode, RefreshCw, Search, ShieldCheck, Users, X } from "lucide-react";
import axios from "axios";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { useAuthStore } from "@/store/auth-store";
import "./App.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const IDENTITY = import.meta.env.VITE_IDENTITY_BASE_URL || "http://localhost:8081";
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Role = "EMPLOYEE" | "SUPERVISOR" | "HR" | "SECURITY" | "ADMIN" | "EXECUTIVE";
type FactoryOption = { factoryId: string; code: string; name: string; active: boolean };
type StationOption = { stationId: string; code: string; factoryId: string; direction: string; active: boolean; factoryActive: boolean; revision: number };
type EmployeeOption = { employeeId: string; employeeCode: string; fullName: string; active: boolean };
type SnapshotOption = { snapshotId: string; factoryId: string; period: string; revision: number; cutoff: string };
type BatchOption = { payload: { batchId: string; snapshot: { period: string; revision: number } }; status: string };
type ReviewOption = { confirmationId: string; outcome: string; occurredAt: string };
type Action = { title: string; method: Method; path: string; hint: string; body?: string; fields?: string[]; roles?: Role[] };
type Module = { id: string; title: string; eyebrow: string; icon: typeof Activity; description: string; actions: Action[]; roles?: Role[] };
const canAccess = (allowed: Role[] | undefined, roles: string[] = []) => !allowed || roles.some(role => allowed.includes(role as Role));
function tokenRoles(token: string | null) { try { if (!token) return []; const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="))); return Array.isArray(claims.roles) ? claims.roles as string[] : []; } catch { return []; } }
function unwrapData<T>(value: unknown): T | null {
  if (typeof value === "object" && value !== null && "data" in value) return (value as { data: T }).data;
  return value as T;
}

const modules: Module[] = [
  { id: "overview", title: "Tổng quan", eyebrow: "WORKSPACE", icon: Activity, description: "Không gian vận hành kiểm soát ra vào và chấm công TMC.", actions: [] },
  { id: "kiosk", roles: ["ADMIN"], title: "M\u00f4 ph\u1ecfng c\u1ed5ng", eyebrow: "GATE SIMULATOR", icon: DoorOpen, description: "Qu\u00e9t QR t\u1ea1i tr\u1ea1m v\u00e0 xem quy\u1ebft \u0111\u1ecbnh v\u00e0o c\u1ed5ng; k\u1ebft qu\u1ea3 m\u1edf c\u1ed5ng \u0111\u01b0\u1ee3c m\u00f4 ph\u1ecfng.", actions: [
    { title: "Qu\u00e9t QR nh\u00e2n vi\u00ean", method: "POST", path: "/access/simulator/scans", hint: "Ch\u1ecdn tr\u1ea1m v\u00e0 d\u00f9ng \u0111\u1ea7u \u0111\u1ecdc QR \u0111\u1ec3 qu\u00e9t.", body: '{\n  "scanId": "",\n  "stationId": "",\n  "deviceId": "",\n  "qrToken": ""\n}' },
  ] },
  { id: "employees", roles: ["ADMIN"], title: "Nhân sự & phân quyền", eyebrow: "IDENTITY", icon: Users, description: "Quản lý tài khoản, vai trò và quyền truy cập nhà máy.", actions: [
    { title: "Danh sách nhân viên", method: "GET", path: "/identity/employees?limit=50&offset=0", hint: "Tối đa 100 nhân viên mỗi lần tải." },
    { title: "Tạo nhân viên", method: "POST", path: "/identity/employees", hint: "Tạo tài khoản nhân viên mới.", body: '{\n  "employeeCode": "EMP-001",\n  "fullName": "Nguyen Van A",\n  "username": "employee001",\n  "password": "",\n  "roles": ["EMPLOYEE"],\n  "factoryIds": []\n}' },
    { title: "Xem / sửa nhân viên", method: "GET", path: "/identity/employees/{employeeId}", hint: "Nhập employeeId vào đường dẫn để xem hồ sơ.", fields: ["employeeId"] },
    { title: "Cập nhật hồ sơ", method: "PUT", path: "/identity/employees/{employeeId}/profile", hint: "Chỉ cập nhật tên hiển thị.", fields: ["employeeId"], body: '{\n  "fullName": "Nguyen Van A"\n}' },
    { title: "Cập nhật vai trò & nhà máy", method: "PUT", path: "/identity/employees/{employeeId}/permissions", hint: "Các vai trò: EMPLOYEE, SUPERVISOR, HR, SECURITY, ADMIN, EXECUTIVE.", fields: ["employeeId"], body: '{\n  "roles": ["EMPLOYEE"],\n  "factoryIds": []\n}' },
    { title: "Bật / khóa tài khoản", method: "PUT", path: "/identity/employees/{employeeId}/status", hint: "Khóa tài khoản sẽ ngăn đăng nhập và truy cập.", fields: ["employeeId"], body: '{\n  "active": false\n}' },
  ] },
  { id: "sites", title: "Nhà máy & trạm", eyebrow: "GATE STATION", icon: Building2, description: "Cấu hình nhà máy, hướng di chuyển và thiết bị tại cổng.", actions: [
    { title: "Danh s\u00e1ch nh\u00e0 m\u00e1y", method: "GET", path: "/stations/factories", hint: "Danh s\u00e1ch c\u00e1c nh\u00e0 m\u00e1y trong h\u1ec7 th\u1ed1ng." },
    { title: "Danh s\u00e1ch tr\u1ea1m v\u00e0 c\u1ed5ng", method: "GET", path: "/stations/stations", hint: "Danh s\u00e1ch c\u00e1c tr\u1ea1m v\u00e0 c\u1ed5ng." },
    { title: "Đăng ký thiết bị kiosk", roles: ["ADMIN"], method: "POST", path: "/identity/devices", hint: "Dùng đúng mã thiết bị đã khai báo tại trạm; bí mật này dùng cho xác thực kiosk.", body: '{\n  "clientId": "kiosk-01",\n  "secret": "",\n  "stationId": ""\n}' },
    { title: "Tạo nhà máy", roles: ["ADMIN"], method: "POST", path: "/stations/factories", hint: "Tạo nhà máy ở trạng thái hoạt động.", body: '{\n  "code": "FACTORY-01",\n  "name": "Nhà máy 1"\n}' },
    { title: "Bật / khóa nhà máy", roles: ["ADMIN"], method: "PUT", path: "/stations/factories/{factoryId}/status", hint: "Nhập factoryId.", fields: ["factoryId"], body: '{\n  "active": true\n}' },
    { title: "Tạo trạm", roles: ["ADMIN"], method: "POST", path: "/stations/stations", hint: "Hướng trạm: ENTRY hoặc EXIT.", body: '{\n  "factoryId": "",\n  "code": "GATE-01",\n  "deviceId": "kiosk-01",\n  "direction": "ENTRY",\n  "controllerReference": "gate-01"\n}' },
    { title: "Xem cấu hình trạm", method: "GET", path: "/stations/stations/{stationId}", hint: "Nhập stationId.", fields: ["stationId"] },
    { title: "Bật / khóa trạm", roles: ["ADMIN"], method: "PUT", path: "/stations/stations/{stationId}/status", hint: "Cần expectedRevision để tránh ghi đè cập nhật mới.", fields: ["stationId"], body: '{\n  "active": true,\n  "expectedRevision": 1\n}' },
  ] },
  { id: "qr", title: "QR nhân viên", eyebrow: "QR CREDENTIALS", icon: QrCode, description: "Cấp QR truy cập nhà máy và thu hồi mã đã phát hành.", actions: [
    { title: "Cấp QR", method: "POST", path: "/qr/me/qr", hint: "QR có thời hạn ngắn; nhân viên chỉ cấp QR cho chính mình.", body: '{\n  "factoryId": ""\n}' },
    { title: "Thu hồi QR", method: "DELETE", path: "/qr/me/qr", hint: "Thu hồi QR của tài khoản đang đăng nhập tại nhà máy.", body: '{\n  "factoryId": ""\n}' },
  ] },
  { id: "attendance", title: "Chấm công", eyebrow: "ATTENDANCE", icon: ClipboardList, description: "Tra cứu kỳ công, gửi điều chỉnh và chốt snapshot kỳ công.", actions: [
    { title: "Xem kỳ công nhà máy", method: "GET", path: "/attendance/factories/{factoryId}/periods/{period}", roles: ["HR", "SUPERVISOR", "EXECUTIVE", "ADMIN"], hint: "Dạng kỳ: YYYY-MM.", fields: ["factoryId", "period"] },
    { title: "Xem kỳ công của tôi", method: "GET", path: "/attendance/me/factories/{factoryId}/periods/{period}", roles: ["EMPLOYEE", "HR", "SUPERVISOR", "EXECUTIVE", "SECURITY", "ADMIN"], hint: "Dạng kỳ: YYYY-MM.", fields: ["factoryId", "period"] },
    { title: "Tạo đề nghị điều chỉnh", method: "POST", path: "/attendance/factories/{factoryId}/adjustments", roles: ["HR", "SUPERVISOR", "ADMIN"], hint: "Đính kèm lý do và bằng chứng theo hợp đồng API.", fields: ["factoryId"], body: '{\n  "adjustmentId": "",\n  "employeeId": "",\n  "direction": "ENTRY",\n  "occurredAt": "2026-11-23T08:00:00Z",\n  "reason": ""\n}' },
    { title: "Chốt kỳ công", method: "POST", path: "/attendance/factories/{factoryId}/periods/{period}/finalizations", roles: ["HR", "ADMIN"], hint: "Chỉ HR hoặc ADMIN có quyền chốt; kỳ phải kết thúc.", fields: ["factoryId", "period"], body: '{\n  "snapshotId": "",\n  "expectedRevision": 0\n}' },
  ] },
  { id: "reviews", roles: ["HR", "SECURITY", "ADMIN"], title: "Duyệt bằng chứng", eyebrow: "ACCESS REVIEW", icon: ShieldCheck, description: "Rà soát bằng chứng cổng và đưa ra quyết định duyệt.", actions: [
    { title: "Danh sách cần rà soát", method: "GET", path: "/access/factories/{factoryId}/reviews", hint: "Nhập factoryId.", fields: ["factoryId"] },
    { title: "Chi tiết bằng chứng", method: "GET", path: "/access/factories/{factoryId}/reviews/{confirmationId}", hint: "Nhập factoryId và confirmationId.", fields: ["factoryId", "confirmationId"] },
    { title: "Duyệt / từ chối", method: "POST", path: "/access/factories/{factoryId}/reviews/{confirmationId}/decisions", hint: "Chỉ HR, SECURITY hoặc ADMIN có quyền.", fields: ["factoryId", "confirmationId"], body: '{\n  "decisionId": "",\n  "approved": true,\n  "reason": ""\n}' },
  ] },
  { id: "audit", roles: ["ADMIN"], title: "Audit & thông báo", eyebrow: "AUDIT TRAIL", icon: FileClock, description: "Theo dõi nhật ký sự kiện và trạng thái thông báo.", actions: [
    { title: "Nhật ký audit", method: "GET", path: "/audit/audit", hint: "Dữ liệu audit chỉ đọc." },
    { title: "Thông báo", method: "GET", path: "/audit/notifications", hint: "Xem các thông báo đã ghi nhận." },
  ] },
  { id: "hr", roles: ["HR", "ADMIN"], title: "Đồng bộ HR", eyebrow: "HR INTEGRATION", icon: DoorOpen, description: "Theo dõi batch xuất công và đối soát receipt HR.", actions: [
    { title: "Tạo batch xuất công", method: "POST", path: "/hr/exports", hint: "Xuất snapshot đã chốt sang hệ thống HR.", body: '{\n  "factoryId": "",\n  "snapshotId": ""\n}' },
    { title: "Xem batch", method: "GET", path: "/hr/exports/{batchId}", hint: "Nhập batchId.", fields: ["factoryId", "batchId"] },
    { title: "Đối soát batch", method: "GET", path: "/hr/exports/{batchId}/reconciliation", hint: "Nhập batchId để xem lịch sử đối soát.", fields: ["factoryId", "batchId"] },
    { title: "Yêu cầu xử lý lại", method: "POST", path: "/hr/exports/{batchId}/retries", hint: "Batch UNKNOWN sẽ lookup receipt trước khi retry.", fields: ["factoryId", "batchId"], body: "{}" },
  ] },
];

function base64url(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
async function startLogin() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const state = crypto.randomUUID();
  sessionStorage.setItem("tmc.pkce.verifier", verifier);
  sessionStorage.setItem("tmc.oauth.state", state);
  const params = new URLSearchParams({ response_type: "code", client_id: import.meta.env.VITE_OAUTH_CLIENT_ID || "tmc-web", redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URI || `${location.origin}/callback`, scope: import.meta.env.VITE_OAUTH_SCOPE || "qr.issue access.review attendance.write hr.export audit.read stations.read stations.manage attendance.read", state, code_challenge: base64url(new Uint8Array(digest)), code_challenge_method: "S256" });
  location.assign(`${IDENTITY}/oauth2/authorize?${params}`);
}

function Login() { return <main className="login-page"><div className="login-visual"><div className="login-brand"><span className="brand-mark"><Fingerprint size={23}/></span><span>TMC <b>ACCESS</b></span></div><div className="login-copy"><span className="eyebrow">WORKFORCE ACCESS PLATFORM</span><h1>Kiểm soát<br/>ra vào, <em>chính xác.</em></h1><p>Một không gian thống nhất cho an ninh cổng, nhân sự và vận hành chấm công.</p><div className="login-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-center"><QrCode size={72}/></div><span className="art-chip chip-a"><ShieldCheck size={15}/> Xác thực an toàn</span><span className="art-chip chip-b"><Activity size={15}/> Theo dõi theo thời gian</span></div></div><small>© 2026 TMC · ACCESS CONTROL & ATTENDANCE</small></div><section className="login-form"><div className="mobile-brand"><span className="brand-mark"><Fingerprint size={22}/></span> TMC <b>ACCESS</b></div><div className="login-panel"><span className="eyebrow">CỔNG QUẢN TRỊ</span><h2>Chào mừng trở lại</h2><p>Đăng nhập bằng tài khoản nhân viên TMC.</p><button className="primary-button login-button" onClick={() => void startLogin()}><KeyRound size={17}/> Đăng nhập an toàn <ArrowRight size={17}/></button><div className="login-note"><ShieldCheck size={16}/><span>Đăng nhập được bảo vệ bằng OAuth 2.0 và PKCE.</span></div><div className="login-divider"><span>HỖ TRỢ KẾT NỐI</span></div><p className="login-help">Nếu bạn chưa được cấp tài khoản, vui lòng liên hệ quản trị viên hệ thống.</p></div></section></main>; }

function Callback() { const navigate = useNavigate(); const [error, setError] = useState(""); const exchangeStarted = useRef(false); useEffect(() => { if (exchangeStarted.current) return; exchangeStarted.current = true; const run = async () => { const params = new URLSearchParams(location.search); const code = params.get("code"); const expectedState = sessionStorage.getItem("tmc.oauth.state"); const verifier = sessionStorage.getItem("tmc.pkce.verifier"); if (!code || !verifier || params.get("state") !== expectedState) { setError(params.get("error_description") || "Phiên đăng nhập không hợp lệ. Vui lòng thử lại."); return; } try { const redirect = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${location.origin}/callback`; const form = new URLSearchParams({ grant_type: "authorization_code", client_id: import.meta.env.VITE_OAUTH_CLIENT_ID || "tmc-web", redirect_uri: redirect, code, code_verifier: verifier }); const tokenEndpoint = import.meta.env.VITE_OAUTH_TOKEN_URL || `${API}/identity/oauth2/token`; const { data } = await axios.post(tokenEndpoint, form, { headers: { "Content-Type": "application/x-www-form-urlencoded" } }); const jwtPayload = data.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(jwtPayload.padEnd(Math.ceil(jwtPayload.length / 4) * 4, "=")), char => char.charCodeAt(0)))); useAuthStore.getState().setSession({ token: data.access_token, user: { id: claims.employee_id || claims.sub, name: claims.name || claims.preferred_username || claims.sub, email: claims.preferred_username || claims.sub, roles: Array.isArray(claims.roles) ? claims.roles : [], factoryIds: Array.isArray(claims.factory_ids) ? claims.factory_ids : [] } }); sessionStorage.removeItem("tmc.pkce.verifier"); sessionStorage.removeItem("tmc.oauth.state"); navigate("/", { replace: true }); } catch (e) { const message = axios.isAxiosError(e) ? e.response?.data?.error_description || e.response?.data?.error : ""; setError(String(message || "Không thể hoàn tất đăng nhập. Kiểm tra cấu hình OAuth và thử lại.")); } }; void run(); }, [navigate]); return <main className="callback-page"><div className="callback-card"><span className="brand-mark"><Fingerprint size={24}/></span><h2>{error ? "Đăng nhập chưa hoàn tất" : "Đang xác thực tài khoản"}</h2><p>{error || "Đang trao đổi mã đăng nhập an toàn với Identity Service…"}</p>{error && <button className="primary-button" onClick={() => navigate("/login")}>Quay lại đăng nhập</button>}</div></main>; }

const fieldLabels: Record<string, string> = {
  factoryId: "Nh\u00e0 m\u00e1y", period: "K\u1ef3 ch\u1ea5m c\u00f4ng", employeeId: "Nh\u00e2n vi\u00ean",
  clientId: "M\u00e3 thi\u1ebft b\u1ecb kiosk", secret: "B\u00ed m\u1eadt thi\u1ebft b\u1ecb",
  batchId: "L\u00f4 \u0111\u1ed3ng b\u1ed9", confirmationId: "L\u01b0\u1ee3t ra v\u00e0o", stationId: "Tr\u1ea1m",
  snapshotId: "M\u00e3 b\u1ea3n ch\u1ed1t c\u00f4ng", adjustmentId: "M\u00e3 \u0111\u1ec1 ngh\u1ecb", decisionId: "M\u00e3 quy\u1ebft \u0111\u1ecbnh",
  fullName: "H\u1ecd v\u00e0 t\u00ean", employeeCode: "M\u00e3 nh\u00e2n vi\u00ean", username: "T\u00ean \u0111\u0103ng nh\u1eadp",
  password: "M\u1eadt kh\u1ea9u", qrToken: "M\u00e3 QR nh\u00e2n vi\u00ean", roles: "Vai tr\u00f2", factoryIds: "Nh\u00e0 m\u00e1y \u0111\u01b0\u1ee3c ph\u00e2n quy\u1ec1n",
  code: "M\u00e3 nh\u00e0 m\u00e1y", name: "T\u00ean nh\u00e0 m\u00e1y", deviceId: "M\u00e3 thi\u1ebft b\u1ecb",
  direction: "Chi\u1ec1u di chuy\u1ec3n", controllerReference: "M\u00e3 b\u1ed9 \u0111i\u1ec1u khi\u1ec3n",
  occurredAt: "Th\u1eddi \u0111i\u1ec3m x\u1ea3y ra", reason: "L\u00fd do", expectedRevision: "Phi\u00ean b\u1ea3n d\u1eef li\u1ec7u",
  approved: "K\u1ebft qu\u1ea3 duy\u1ec7t", active: "Tr\u1ea1ng th\u00e1i",
};
const generatedFields = new Set(["adjustmentId", "decisionId", "scanId"]);
const directionOptions = [{ value: "ENTRY", label: "V\u00e0o" }, { value: "EXIT", label: "Ra" }];

function EndpointForm({ action, onDone, factories = [], stations = [], employees = [] }: {
  action: Action;
  onDone: (data: unknown, status: number) => void;
  factories?: FactoryOption[];
  stations?: StationOption[];
  employees?: EmployeeOption[];
}) {
  const [bodyValues, setBodyValues] = useState<Record<string, unknown>>(() => JSON.parse(action.body || "{}"));
  const [params, setParams] = useState<Record<string, string>>({});
  const [factoryEmployees, setFactoryEmployees] = useState<EmployeeOption[]>(employees);
  const [snapshotOptions, setSnapshotOptions] = useState<SnapshotOption[]>([]);
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
  const [reviewOptions, setReviewOptions] = useState<ReviewOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const bodyFields = Object.keys(bodyValues).filter(key => !generatedFields.has(key) && key !== "expectedRevision" && key !== "deviceId");
  useEffect(() => {
    setFactoryEmployees(employees);
    if (!params.factoryId || !bodyFields.includes("employeeId")) return;
    const config = { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } };
    void axios.get<unknown>(`${API}/identity/employees/factories/${params.factoryId}`, config)
      .then(response => { const options = unwrapData<EmployeeOption[]>(response.data); if (Array.isArray(options)) setFactoryEmployees(options); })
      .catch(() => setFactoryEmployees([]));
  }, [params.factoryId, employees]);
  const selectedFactoryId = params.factoryId || String(bodyValues.factoryId || "");
  useEffect(() => {
    setSnapshotOptions([]); setBatchOptions([]); setReviewOptions([]);
    if (!selectedFactoryId) return;
    const config = { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } };
    if (bodyFields.includes("snapshotId")) void axios.get<unknown>(`${API}/attendance/factories/${selectedFactoryId}/snapshots`, config)
      .then(response => { const options = unwrapData<SnapshotOption[]>(response.data); if (Array.isArray(options)) setSnapshotOptions(options); })
      .catch(() => setSnapshotOptions([]));
    if (action.fields?.includes("batchId")) void axios.get<unknown>(`${API}/hr/exports`, { ...config, params: { factoryId: selectedFactoryId } })
      .then(response => { const options = unwrapData<BatchOption[]>(response.data); if (Array.isArray(options)) setBatchOptions(options); })
      .catch(() => setBatchOptions([]));
    if (action.fields?.includes("confirmationId")) void axios.get<unknown>(`${API}/access/factories/${selectedFactoryId}/reviews`, config)
      .then(response => { const page = unwrapData<ReviewOption[] | { items?: ReviewOption[] }>(response.data); const options = Array.isArray(page) ? page : page?.items; if (Array.isArray(options)) setReviewOptions(options); })
      .catch(() => setReviewOptions([]));
  }, [selectedFactoryId, action.path]);

  function updateBody(key: string, value: unknown) {
    setBodyValues(current => ({ ...current, [key]: value }));
  }

  async function selectSimulatorStation(stationId: string) {
    updateBody("stationId", stationId);
    updateBody("deviceId", "");
    if (action.path !== "/access/simulator/scans" || !stationId) return;
    try {
      const response = await axios.get<unknown>(`${API}/stations/stations/${stationId}`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      });
      const station = unwrapData<{ deviceId?: string }>(response.data);
      if (!station?.deviceId) throw new Error("Mã thiết bị của trạm chưa được cấu hình.");
      updateBody("deviceId", station.deviceId);
      setError("");
    } catch {
      setError("Không tải được cấu hình thiết bị của trạm. Hãy chọn lại trạm hoặc kiểm tra quyền quản trị.");
    }
  }

  function renderBodyField(key: string) {
    const value = bodyValues[key];
    if (key === "stationId" && action.path === "/identity/devices") {
      return <select required value={String(value || "")} onChange={event => updateBody(key, event.target.value)}>
        <option value="">{stations.length ? "Ch\u1ecdn tr\u1ea1m \u0111\u00e3 t\u1ea1o" : "Ch\u01b0a c\u00f3 tr\u1ea1m"}</option>
        {stations.map(station => <option key={station.stationId} value={station.stationId}>{station.code} \u00b7 {station.direction === "ENTRY" ? "C\u1ed5ng v\u00e0o" : "C\u1ed5ng ra"}</option>)}
      </select>;
    }
    if (key === "secret" && action.path === "/identity/devices") {
      return <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" placeholder="T\u1ef1 t\u1ea1o b\u00ed m\u1eadt t\u1eeb 12\u201372 k\u00fd t\u1ef1" value={String(value || "")} onChange={event => updateBody(key, event.target.value)} />;
    }
    if (key === "stationId" && action.path === "/access/simulator/scans") {
      return <select required value={String(value || "")} onChange={event => void selectSimulatorStation(event.target.value)}>
        <option value="">{stations.length ? "Chọn trạm quét" : "Chưa có trạm khả dụng"}</option>
        {stations.map(station => <option key={station.stationId} value={station.stationId}>{station.code} · {station.direction === "ENTRY" ? "Cổng vào" : "Cổng ra"}</option>)}
      </select>;
    }
    if (key === "qrToken" && action.path === "/access/simulator/scans") {
      return <input required type="password" autoComplete="off" placeholder="Quét bằng đầu đọc QR" value={String(value || "")} onChange={event => updateBody(key, event.target.value)} />;
    }
    if (key === "roles") {
      const options: Role[] = ["EMPLOYEE", "SUPERVISOR", "HR", "SECURITY", "ADMIN", "EXECUTIVE"];
      return <select multiple required value={Array.isArray(value) ? value.map(String) : []}
        onChange={event => updateBody(key, Array.from(event.target.selectedOptions, option => option.value))}>
        {options.map(role => <option key={role} value={role}>{role}</option>)}
      </select>;
    }
    if (key === "factoryIds") {
      return <select multiple value={Array.isArray(value) ? value.map(String) : []} disabled={!factories.length}
        onChange={event => updateBody(key, Array.from(event.target.selectedOptions, option => option.value))}>
        {factories.map(factory => <option key={factory.factoryId} value={factory.factoryId}>{factory.code}{" \u00b7 "}{factory.name}</option>)}
      </select>;
    }
    if (Array.isArray(value)) {
      return <select multiple value={value.map(String)} onChange={event => updateBody(key, Array.from(event.target.selectedOptions, option => option.value))}>
        {value.map(item => <option key={String(item)} value={String(item)}>{String(item)}</option>)}
      </select>;
    }
    if (key === "snapshotId") {
      return <select required value={String(value || "")} disabled={!snapshotOptions.length} onChange={event => updateBody(key, event.target.value)}>
        <option value="">{snapshotOptions.length ? "Ch\u1ecdn b\u1ea3n ch\u1ed1t c\u00f4ng" : "Ch\u1ecdn nh\u00e0 m\u00e1y tr\u01b0\u1edbc ho\u1eb7c ch\u01b0a c\u00f3 b\u1ea3n ch\u1ed1t"}</option>
        {snapshotOptions.map(snapshot => <option key={snapshot.snapshotId} value={snapshot.snapshotId}>{snapshot.period}{" \u00b7 "}L\u1ea7n ch\u1ed1t {snapshot.revision}</option>)}
      </select>;
    }
    if (key === "employeeId") {
      const options = factoryEmployees.length ? factoryEmployees : employees;
      return <select required value={String(value || "")} disabled={!options.length}
        onChange={event => updateBody(key, event.target.value)}>
        <option value="">{options.length ? "Ch\u1ecdn nh\u00e2n vi\u00ean" : "Ch\u1ecdn nh\u00e0 m\u00e1y tr\u01b0\u1edbc"}</option>
        {options.map(employee => <option key={employee.employeeId} value={employee.employeeId}>{employee.employeeCode}{" \u00b7 "}{employee.fullName}</option>)}
      </select>;
    }
    if (key === "factoryId") {
      return <select required disabled={!factories.length} value={String(value || "")} onChange={event => updateBody(key, event.target.value)}>
        <option value="">{factories.length ? "Ch\u1ecdn nh\u00e0 m\u00e1y" : "Kh\u00f4ng c\u00f3 nh\u00e0 m\u00e1y \u0111\u01b0\u1ee3c c\u1ea5p"}</option>
        {factories.map(factory => <option key={factory.factoryId} value={factory.factoryId}>{factory.code}{" \u00b7 "}{factory.name}</option>)}
      </select>;
    }
    if (typeof value === "boolean") {
      return <select value={String(value)} onChange={event => updateBody(key, event.target.value === "true")}>
        <option value="true">{key === "approved" ? "Duy\u1ec7t" : "\u0110ang ho\u1ea1t \u0111\u1ed9ng"}</option>
        <option value="false">{key === "approved" ? "T\u1eeb ch\u1ed1i" : "Ng\u1eebng ho\u1ea1t \u0111\u1ed9ng"}</option>
      </select>;
    }
    if (key === "direction") {
      return <select required value={String(value || "ENTRY")} onChange={event => updateBody(key, event.target.value)}>
        {directionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>;
    }
    const inputType = key === "occurredAt" ? "datetime-local" : key === "period" ? "month" : key === "expectedRevision" ? "number" : "text";
    const inputValue = key === "occurredAt" && typeof value === "string" ? value.slice(0, 16) : String(value ?? "");
    return <input required type={inputType} value={inputValue}
      min={inputType === "number" ? 0 : undefined}
      placeholder={key === "factoryId" ? "Nh\u1eadp m\u00e3 nh\u00e0 m\u00e1y do qu\u1ea3n tr\u1ecb vi\u00ean cung c\u1ea5p" : undefined}
      onChange={event => updateBody(key, key === "expectedRevision" ? Number(event.target.value) : event.target.value)} />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const path = action.path.replace(/\{([^}]+)\}/g, (_, key: string) => encodeURIComponent(params[key] || ""));
      if (action.fields?.some(field => !params[field]?.trim())) throw new Error("Vui l\u00f2ng \u0111i\u1ec1n \u0111\u1ea7y \u0111\u1ee7 th\u00f4ng tin.");
      const requestBody = { ...bodyValues } as Record<string, unknown>;
      if ("expectedRevision" in requestBody) {
        const selectedStation = stations.find(station => station.stationId === params.stationId);
        if (!selectedStation) throw new Error("Vui l\u00f2ng ch\u1ecdn tr\u1ea1m tr\u01b0\u1edbc khi c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i.");
        requestBody.expectedRevision = selectedStation.revision;
      }
      generatedFields.forEach(key => { if (key in requestBody && !requestBody[key]) requestBody[key] = crypto.randomUUID(); });
      if (action.path === "/access/simulator/scans" && (typeof requestBody.deviceId !== "string" || !requestBody.deviceId)) {
        throw new Error("Vui lòng chọn trạm có thiết bị đã được cấu hình.");
      }
      if (typeof requestBody.occurredAt === "string" && requestBody.occurredAt) requestBody.occurredAt = new Date(requestBody.occurredAt).toISOString();
      const config = { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } };
      let response;
      if (action.method === "GET") response = await axios.get(`${API}${path}`, config);
      else if (action.method === "DELETE") response = await axios.delete(`${API}${path}`, { ...config, data: requestBody });
      else response = await axios({ baseURL: API, url: path, method: action.method, data: requestBody, ...config });
      onDone(response.data, response.status);
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      const serverMessage = axios.isAxiosError(cause) ? cause.response?.data?.message || cause.response?.data?.code : "";
      const friendlyMessage = status === 401 ? "Phi\u00ean \u0111\u0103ng nh\u1eadp \u0111\u00e3 h\u1ebft h\u1ea1n. Vui l\u00f2ng \u0111\u0103ng nh\u1eadp l\u1ea1i."
        : status === 403 ? (action.method === "GET" ? "Phi\u00ean \u0111\u0103ng nh\u1eadp ch\u01b0a c\u00f3 quy\u1ec1n xem d\u1eef li\u1ec7u n\u00e0y. H\u00e3y \u0111\u0103ng xu\u1ea5t v\u00e0 \u0111\u0103ng nh\u1eadp l\u1ea1i." : "Ch\u1ec9 t\u00e0i kho\u1ea3n qu\u1ea3n tr\u1ecb m\u1edbi \u0111\u01b0\u1ee3c ph\u00e9p thay \u0111\u1ed5i nh\u00e0 m\u00e1y v\u00e0 tr\u1ea1m.")
        : status === 404 ? "Kh\u00f4ng t\u00ecm th\u1ea5y th\u00f4ng tin c\u1ea7n x\u1eed l\u00fd. H\u00e3y ki\u1ec3m tra l\u1ea1i m\u00e3 \u0111\u00e3 nh\u1eadp."
        : status === 400 ? "Th\u00f4ng tin ch\u01b0a h\u1ee3p l\u1ec7. Vui l\u00f2ng ki\u1ec3m tra c\u00e1c tr\u01b0\u1eddng \u0111\u00e3 nh\u1eadp."
        : status === 409 ? "Th\u00f4ng tin \u0111\u00e3 \u0111\u01b0\u1ee3c x\u1eed l\u00fd ho\u1eb7c kh\u00f4ng c\u00f2n m\u1edbi nh\u1ea5t. H\u00e3y t\u1ea3i l\u1ea1i r\u1ed3i th\u1eed l\u1ea1i."
        : status && status >= 500 ? "D\u1ecbch v\u1ee5 \u0111ang t\u1ea1m th\u1eddi gi\u00e1n \u0111o\u1ea1n. Vui l\u00f2ng th\u1eed l\u1ea1i sau."
        : "Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i d\u1ecbch v\u1ee5 l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i sau.";
      setError(serverMessage && !status ? String(serverMessage) : friendlyMessage);
    } finally {
      setBusy(false);
    }
  }

  return <form className="endpoint-form" onSubmit={event => void submit(event)}>
    <p className="action-hint">{action.hint}</p>
    {action.fields?.map(field => <label className="field-label" key={field}>{fieldLabels[field] || field}
      {field === "batchId" ? <select required value={params[field] || ""} disabled={!batchOptions.length}
        onChange={event => setParams(current => ({ ...current, [field]: event.target.value }))}>
        <option value="">{batchOptions.length ? "Ch\u1ecdn l\u00f4 \u0111\u1ed3ng b\u1ed9" : "Ch\u01b0a c\u00f3 l\u00f4 cho nh\u00e0 m\u00e1y n\u00e0y"}</option>
        {batchOptions.map(batch => <option key={batch.payload.batchId} value={batch.payload.batchId}>{batch.payload.snapshot.period}{" \u00b7 "}L\u1ea7n {batch.payload.snapshot.revision}{" \u00b7 "}{batch.status}</option>)}
      </select> : field === "confirmationId" ? <select required value={params[field] || ""} disabled={!reviewOptions.length}
        onChange={event => setParams(current => ({ ...current, [field]: event.target.value }))}>
        <option value="">{reviewOptions.length ? "Ch\u1ecdn b\u1eb1ng ch\u1ee9ng c\u1ea7n xem" : "Kh\u00f4ng c\u00f3 b\u1eb1ng ch\u1ee9ng \u0111ang ch\u1edd"}</option>
        {reviewOptions.map(review => <option key={review.confirmationId} value={review.confirmationId}>{review.outcome}{" \u00b7 "}{new Date(review.occurredAt).toLocaleString("vi-VN")}</option>)}
      </select> : field === "employeeId" ? <select required value={params[field] || ""} disabled={!employees.length}
        onChange={event => setParams(current => ({ ...current, [field]: event.target.value }))}>
        <option value="">{employees.length ? "Ch\u1ecdn nh\u00e2n vi\u00ean" : "Kh\u00f4ng c\u00f3 nh\u00e2n vi\u00ean"}</option>
        {employees.map(employee => <option key={employee.employeeId} value={employee.employeeId}>{employee.employeeCode}{" \u00b7 "}{employee.fullName}</option>)}
      </select> : field === "stationId" ? <select required value={params[field] || ""} onChange={event => setParams(current => ({ ...current, [field]: event.target.value }))}>
        <option value="">{stations.length ? "Ch\u1ecdn tr\u1ea1m" : "Ch\u01b0a c\u00f3 tr\u1ea1m kh\u1ea3 d\u1ee5ng"}</option>
        {stations.map(station => <option key={station.stationId} value={station.stationId}>{station.code}{" \u00b7 "}{station.direction === "ENTRY" ? "C\u1eeda v\u00e0o" : "C\u1eeda ra"}{station.active && station.factoryActive ? "" : " \u00b7 Ng\u01b0ng ho\u1ea1t \u0111\u1ed9ng"}</option>)}
      </select> : field === "factoryId" ? <select required disabled={!factories.length} value={params[field] || ""}
        onChange={event => setParams(current => ({ ...current, [field]: event.target.value }))}>
        <option value="">{factories.length ? "Ch\u1ecdn nh\u00e0 m\u00e1y" : "Kh\u00f4ng c\u00f3 nh\u00e0 m\u00e1y \u0111\u01b0\u1ee3c c\u1ea5p"}</option>
        {factories.map(factory => <option key={factory.factoryId} value={factory.factoryId}>{factory.code}{" \u00b7 "}{factory.name}</option>)}
      </select> : <input required type={field === "period" ? "month" : "text"} value={params[field] || ""}
        placeholder={`Nh\u1eadp ${fieldLabels[field] || field}`}
        onChange={event => setParams(current => ({ ...current, [field]: event.target.value }))} />}
    </label>)}
    {bodyFields.map(key => <label className="field-label" key={key}>{fieldLabels[key] || key}{renderBodyField(key)}</label>)}
    {action.path === "/access/simulator/scans" && <>
      <button type="button" className="scanner-toggle" onClick={() => setCameraActive(value => !value)}><QrCode size={15}/>{cameraActive ? "Đóng camera" : "Quét bằng camera"}</button>
      {cameraActive && <QrCamera onScan={value => { updateBody("qrToken", value); setCameraActive(false); }} onClose={() => setCameraActive(false)} />}
    </>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <button className="primary-button submit-button" disabled={busy}>
      {busy ? "\u0110ang x\u1eed l\u00fd" : action.path === "/access/simulator/scans" ? "Qu\u00e9t QR" : action.method === "GET" ? "Xem th\u00f4ng tin" : "X\u00e1c nh\u1eadn"}<ArrowRight size={15}/>
    </button>
  </form>;
}

function QrCamera({ onScan, onClose }: { onScan: (value: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [message, setMessage] = useState("Đang khởi động camera…");
  useEffect(() => {
    type Barcode = { rawValue: string };
    type Detector = { detect: (source: HTMLVideoElement) => Promise<Barcode[]> };
    type DetectorConstructor = new (options: { formats: string[] }) => Detector;
    const BarcodeDetector = (window as Window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Không truy cập được camera trên thiết bị này.");
      return;
    }
    let disposed = false;
    let timer = 0;
    let stream: MediaStream | null = null;
    const detector = BarcodeDetector ? new BarcodeDetector({ formats: ["qr_code"] }) : null;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then(async media => {
        stream = media;
        if (!videoRef.current || disposed) { media.getTracks().forEach(track => track.stop()); return; }
        videoRef.current.srcObject = media;
        await videoRef.current.play();
        setMessage(BarcodeDetector
          ? "Hướng camera vào mã QR của nhân viên."
          : "Hướng camera vào mã QR; mã được quét trực tiếp trên trình duyệt.");
        const detect = async () => {
          if (disposed || !videoRef.current) return;
          try {
            if (detector) {
              const codes = await detector.detect(videoRef.current);
              if (codes[0]?.rawValue) { onScanRef.current(codes[0].rawValue); return; }
            } else if (context && videoRef.current.videoWidth > 0) {
              const scale = Math.min(1, 640 / videoRef.current.videoWidth);
              canvas.width = Math.round(videoRef.current.videoWidth * scale);
              canvas.height = Math.round(videoRef.current.videoHeight * scale);
              context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" });
              if (code?.data) { onScanRef.current(code.data); return; }
            }
          } catch { /* Keep scanning while the camera settles. */ }
          if (!disposed) timer = window.setTimeout(() => void detect(), 160);
        };
        void detect();
      })
      .catch(() => setMessage("Không mở được camera. Kiểm tra quyền truy cập hoặc dùng đầu đọc QR."));
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);
  return <div className="qr-camera-panel">
    <video ref={videoRef} className="qr-camera-video" muted playsInline />
    <p>{message}</p>
    <button type="button" className="text-button" onClick={onClose}>Đóng</button>
  </div>;
}

function OperationResultView({ action, data, factories = [], stations = [], employees = [], onContinue }: {
  action: Action; data: unknown; factories?: FactoryOption[]; stations?: StationOption[]; employees?: EmployeeOption[]; onContinue?: () => void;
}) {
  const result = unwrapData<unknown>(data);
  if (action.path === "/access/simulator/scans" && typeof result === "object" && result !== null) {
    return <GateSimulationResult data={result as Record<string, unknown>} factories={factories} stations={stations} employees={employees} onContinue={onContinue} />;
  }
  if (action.path === "/qr/me/qr" && action.method === "POST" && typeof result === "object" && result !== null) {
    const issuedQr = result as Record<string, unknown>;
    return <IssuedQrResult qrId={issuedQr.qrId} token={issuedQr.token} expiresAt={issuedQr.expiresAt} />;
  }
  const page = typeof result === "object" && result !== null && !Array.isArray(result) ? result as { items?: unknown[]; total?: number } : null;
  const rows = Array.isArray(result) ? result : Array.isArray(page?.items) ? page.items : null;
  if (action.title === "Danh sách nhân viên" && rows) {
    const employees = rows.filter((row): row is EmployeeOption => typeof row === "object" && row !== null);
    return <div className="result-content"><div className="result-summary">{page?.total ?? employees.length} nhân viên</div>
      {employees.length ? <div className="result-table-wrap"><table className="result-table"><thead><tr><th>Mã nhân viên</th><th>Họ và tên</th><th>Trạng thái</th></tr></thead><tbody>
        {employees.map(employee => <tr key={employee.employeeId}><td>{employee.employeeCode || "—"}</td><td>{employee.fullName || "—"}</td><td><span className={`employee-state ${employee.active ? "is-active" : "is-inactive"}`}>{employee.active ? "Đang hoạt động" : "Đã khóa"}</span></td></tr>)}
      </tbody></table></div> : <div className="result-empty">Chưa có nhân viên nào.</div>}</div>;
  }
  if (rows) return <div className="result-content"><div className="result-summary">{rows.length} kết quả</div>{rows.length ? <div className="result-list">{rows.slice(0, 30).map((row, index) => <div className="result-item" key={index}>{formatResult(row)}</div>)}</div> : <div className="result-empty">Không có dữ liệu phù hợp.</div>}</div>;
  if (typeof result === "object" && result !== null) {
    const fields = Object.entries(result as Record<string, unknown>).filter(([key, value]) => value !== null && value !== undefined && !["employeeId", "factoryId", "stationId", "snapshotId", "batchId", "confirmationId"].includes(key));
    return <div className="result-content"><dl className="result-fields">{fields.map(([key, value]) => <div key={key}><dt>{fieldLabels[key] || humanizeKey(key)}</dt><dd>{formatResult(value)}</dd></div>)}</dl></div>;
  }
  return <div className="result-content"><div className="result-empty">{result == null ? "Thao tác đã hoàn tất." : formatResult(result)}</div></div>;
}
function GateSimulationResult({ data, factories, stations, employees, onContinue }: {
  data: Record<string, unknown>; factories: FactoryOption[]; stations: StationOption[]; employees: EmployeeOption[]; onContinue?: () => void;
}) {
  const scan = data.scan as { employeeId?: string; factoryId?: string; stationId?: string; direction?: string; allowed?: boolean; reason?: string; commandId?: string; } | null;
  const gate = data.gate as { outcome?: string; gateState?: string; occurredAt?: string; closesAt?: string; reason?: string } | null;
  if (!scan) return <div className="result-empty">Không đọc được kết quả lượt quét.</div>;
  const employee = employees.find(item => item.employeeId === scan.employeeId);
  const factory = factories.find(item => item.factoryId === scan.factoryId);
  const station = stations.find(item => item.stationId === scan.stationId);
  const opened = scan.allowed === true && gate?.outcome === "OPENED";
  const title = opened ? "Vào cổng thành công" : scan.allowed ? "Cổng mô phỏng chưa mở" : "Không thể vào cổng";
  const reasonLabels: Record<string, string> = {
    INVALID_OR_REVOKED_QR: "Mã QR không hợp lệ hoặc đã bị thu hồi.",
    QR_EXPIRED: "Mã QR đã hết hạn. Hãy cấp mã mới.",
    QR_REPLAYED: "Mã QR này đã được sử dụng.",
    SITE_ACCESS_DENIED: "Nhân viên chưa được cấp quyền vào nhà máy này.",
    STATION_ACCESS_DENIED: "Trạm đang khóa hoặc không được phép hoạt động.",
    DEVICE_DISABLED_OR_MISMATCH: "Thiết bị không được gán cho trạm đã chọn.",
    COMMAND_EXPIRED: "Lệnh đã hết hạn trước khi simulator xử lý.",
  };
  const occurredAt = gate?.occurredAt ? new Date(gate.occurredAt) : new Date();
  return <div className={`gate-simulation-result ${opened ? "gate-simulation-open" : "gate-simulation-denied"}`}>
    <div className="gate-simulation-banner">
      <span>{opened ? "ACCESS GRANTED · GATE OPENED (SIMULATED)" : scan.allowed ? "ACCESS GRANTED · GATE NOT OPENED" : "ACCESS DENIED"}</span>
      <h3>{title}</h3>
    </div>
    {opened ? <dl className="gate-simulation-details">
      <div><dt>Nhân viên</dt><dd>{employee?.fullName || (scan.employeeId ? `Nhân viên ${scan.employeeId.slice(0, 8)}` : "—")}</dd></div>
      <div><dt>Mã nhân viên</dt><dd>{employee?.employeeCode || "—"}</dd></div>
      <div><dt>Nhà máy</dt><dd>{factory?.name || "—"}</dd></div>
      <div><dt>Trạm cổng</dt><dd>{station?.code || "—"}</dd></div>
      <div><dt>Hướng</dt><dd>{scan.direction === "ENTRY" ? "IN · Đi vào" : "OUT · Đi ra"}</dd></div>
      <div><dt>Thời gian</dt><dd>{Number.isNaN(occurredAt.getTime()) ? "—" : occurredAt.toLocaleString("vi-VN")}</dd></div>
    </dl> : <p className="gate-simulation-reason">{reasonLabels[gate?.reason || scan.reason || ""] || "Yêu cầu bị từ chối. Kiểm tra quyền nhân viên, nhà máy và trạm."}</p>}
    <div className="gate-simulation-checks">
      <div><span>Kết quả kiểm tra QR</span><b>{scan.allowed ? "Hợp lệ" : "Không hợp lệ"}</b></div>
      <div><span>Access Policy</span><b>{scan.allowed ? "ALLOW" : "DENY"}</b></div>
      {scan.allowed && <div><span>Gate Command</span><b>{gate?.outcome === "OPENED" ? "OPENED (SIMULATED)" : gate?.outcome || "PENDING"}</b></div>}
    </div>
    <p className="gate-simulation-footnote">Cổng được mô phỏng bằng phần mềm; không có thiết bị vật lý được điều khiển.</p>
    {onContinue && <button type="button" className="primary-button gate-simulation-continue" onClick={onContinue}>Quét lượt tiếp theo <ArrowRight size={15}/></button>}
  </div>;
}
function IssuedQrResult({ qrId, token, expiresAt }: { qrId: unknown; token: unknown; expiresAt: unknown }) {
  const [image, setImage] = useState("");
  const [qrError, setQrError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const tokenValue = typeof token === "string" ? token : "";
  const expiration = typeof expiresAt === "string" ? new Date(expiresAt) : null;
  useEffect(() => {
    let cancelled = false;
    if (!tokenValue) { setQrError(true); return; }
    void QRCode.toDataURL(tokenValue, { width: 240, margin: 2, errorCorrectionLevel: "M", color: { dark: "#141314", light: "#ffffff" } })
      .then(dataUrl => { if (!cancelled) { setImage(dataUrl); setQrError(false); } })
      .catch(() => { if (!cancelled) setQrError(true); });
    return () => { cancelled = true; };
  }, [tokenValue]);
  useEffect(() => {
    if (!expiration || Number.isNaN(expiration.getTime())) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  const remainingSeconds = expiration && !Number.isNaN(expiration.getTime())
    ? Math.max(0, Math.ceil((expiration.getTime() - now) / 1000)) : null;
  const expired = remainingSeconds === 0;
  return <div className="issued-qr-result">
    {typeof qrId === "string" && <div className="issued-qr-id"><span>Mã QR</span><code>{qrId}</code></div>}
    {qrError ? <div className="result-empty">Không thể tạo hình mã QR từ token này.</div> : expired
      ? <div className="issued-qr-expired" role="status">Mã QR đã hết hạn. Hãy cấp mã mới để tiếp tục.</div>
      : image ? <img className="issued-qr-image" src={image} alt="Mã QR truy cập nhà máy" />
      : <div className="issued-qr-loading">Đang tạo mã QR…</div>}
    {remainingSeconds !== null && !expired && <div className="issued-qr-countdown" role="timer">Hiệu lực còn {remainingSeconds} giây</div>}
    {expiration && !Number.isNaN(expiration.getTime()) && <div className="issued-qr-expiry"><span>Hết hạn lúc</span><b>{expiration.toLocaleString("vi-VN")}</b></div>}
  </div>;
}
function humanizeKey(key: string) { return key.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase()); }
function formatResult(value: unknown): string {
  if (typeof value === "boolean") return value ? "C\u00f3" : "Kh\u00f4ng";
  if (value == null) return "?";
  if (typeof value === "object") {
    if (Array.isArray(value)) return `${value.length} m\u1ee5c`;
    const row = value as Record<string, unknown>;
    const parts = [row.code, row.factoryCode, row.stationCode, row.name,
      row.direction === "ENTRY" ? "C\u1eeda v\u00e0o" : row.direction === "EXIT" ? "C\u1eeda ra" : null,
      typeof row.active === "boolean" ? (row.active ? "\u0110ang ho\u1ea1t \u0111\u1ed9ng" : "Ng\u01b0ng ho\u1ea1t \u0111\u1ed9ng") : null]
      .filter((part): part is string => typeof part === "string" && part.length > 0);
    return parts.length ? parts.join(" · ") : "\u0110\u00e3 ghi nh\u1eadn";
  }
  return String(value);
}

function Workspace() { const { user, token, clearSession } = useAuthStore(); const [selected, setSelected] = useState("overview"); const [result, setResult] = useState<{data: unknown; status: number; action: Action} | null>(null); const [mobileMenu, setMobileMenu] = useState(false); const [query, setQuery] = useState(""); const [factoryOptions, setFactoryOptions] = useState<FactoryOption[]>([]); const [factoryLoadError, setFactoryLoadError] = useState(""); const [stationOptions, setStationOptions] = useState<StationOption[]>([]); const [stationLoadError, setStationLoadError] = useState(""); const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]); const navigate = useNavigate(); const roles = useMemo(() => tokenRoles(token), [token]); const visibleModules = modules.filter(m => canAccess(m.roles, roles)); const current = visibleModules.find(m => m.id === selected) || modules[0]; const visibleActions = current.actions.filter(action => canAccess(action.roles, roles)); const filtered = visibleModules.filter(m => m.title.toLowerCase().includes(query.toLowerCase())); useEffect(() => { if (!visibleModules.some(module => module.id === selected)) { setSelected("overview"); setResult(null); } }, [visibleModules, selected]); useEffect(() => { if (!token) { navigate("/login", { replace: true }); return; } const config = { headers: { Authorization: `Bearer ${token}` } }; void Promise.all([axios.get<unknown>(`${API}/stations/factories`, config).then(response => { const options = unwrapData<FactoryOption[]>(response.data); if (Array.isArray(options)) { setFactoryOptions(options); setFactoryLoadError(""); } else { setFactoryOptions([]); setFactoryLoadError("D\u1ecbch v\u1ee5 tr\u1ea3 v\u1ec1 danh s\u00e1ch nh\u00e0 m\u00e1y kh\u00f4ng \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng."); } }).catch(error => { setFactoryOptions([]); const status = axios.isAxiosError(error) ? error.response?.status : undefined; const message = axios.isAxiosError(error) ? error.response?.data?.message : ""; setFactoryLoadError(status === 403 ? "Phi\u00ean \u0111\u0103ng nh\u1eadp ch\u01b0a c\u00f3 quy\u1ec1n xem nh\u00e0 m\u00e1y. H\u00e3y \u0111\u0103ng xu\u1ea5t v\u00e0 \u0111\u0103ng nh\u1eadp l\u1ea1i." : status ? `Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch nh\u00e0 m\u00e1y (HTTP ${status})${message ? `: ${message}` : "."}` : "Kh\u00f4ng k\u1ebft n\u1ed1i \u0111\u01b0\u1ee3c d\u1ecbch v\u1ee5 nh\u00e0 m\u00e1y. H\u00e3y ki\u1ec3m tra API Gateway v\u00e0 Gate Station Service."); }), axios.get<unknown>(`${API}/stations/stations`, config).then(response => { const options = unwrapData<StationOption[]>(response.data); if (Array.isArray(options)) { setStationOptions(options); setStationLoadError(""); } else { setStationOptions([]); setStationLoadError("D\u1ecbch v\u1ee5 tr\u1ea1m tr\u1ea3 v\u1ec1 d\u1eef li\u1ec7u kh\u00f4ng h\u1ee3p l\u1ec7."); } }).catch(error => { setStationOptions([]); const status = axios.isAxiosError(error) ? error.response?.status : undefined; setStationLoadError(status === 403 ? "Phi\u00ean \u0111\u0103ng nh\u1eadp ch\u01b0a c\u00f3 quy\u1ec1n xem tr\u1ea1m. H\u00e3y \u0111\u0103ng xu\u1ea5t v\u00e0 \u0111\u0103ng nh\u1eadp l\u1ea1i." : status ? `Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch tr\u1ea1m (HTTP ${status}).` : "Kh\u00f4ng k\u1ebft n\u1ed1i \u0111\u01b0\u1ee3c d\u1ecbch v\u1ee5 tr\u1ea1m."); }), ...(roles.includes("ADMIN") ? [axios.get<unknown>(`${API}/identity/employees?limit=100&offset=0`, config).then(response => { const page = unwrapData<{ items?: EmployeeOption[] }>(response.data); if (Array.isArray(page?.items)) setEmployeeOptions(page.items); }).catch(() => setEmployeeOptions([]))] : [])]); }, [token, navigate, roles]); function select(id: string) { if (!visibleModules.some(module => module.id === id)) return; setSelected(id); setResult(null); setMobileMenu(false); }
  return <div className="workspace"><aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}><div className="sidebar-brand"><span className="brand-mark"><Fingerprint size={21}/></span><span>TMC <b>ACCESS</b><small>CONTROL CENTER</small></span><button className="mobile-close" onClick={() => setMobileMenu(false)}><X size={18}/></button></div><div className="sidebar-label">KHÔNG GIAN LÀM VIỆC</div><nav>{visibleModules.map(item => <button key={item.id} className={`nav-item ${selected === item.id ? "nav-active" : ""}`} onClick={() => select(item.id)}><item.icon size={18}/><span>{item.title}</span>{item.id === "overview" && <span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><div className="service-status"><div><b>K&#7871;t n&#7889;i h&#7879; th&#7889;ng</b><small>&#272;ang ho&#7841;t &#273;&#7897;ng</small></div></div><div className="user-profile"><div className="user-avatar">{(user?.name || "A").slice(0,1).toUpperCase()}</div><div className="user-details"><b>{user?.name || "Tài khoản"}</b><small>{user?.email}</small></div><button className="icon-button" title="Đăng xuất" onClick={() => { clearSession(); const form = document.createElement("form"); form.method = "POST"; form.action = `${IDENTITY}/logout`; document.body.append(form); form.submit(); }}><LogOut size={17}/></button></div></div></aside>{mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Đóng menu"/>}<main className="main-area"><header className="topbar"><button className="mobile-menu-button" onClick={() => setMobileMenu(true)}><Menu size={20}/></button><div className="breadcrumbs">TMC Access <span>/</span> <b>{current.title}</b></div><div className="topbar-right"><span className="live-pill"><i/> Phiên OAuth đang hoạt động</span><div className="top-avatar">{(user?.name || "A").slice(0,1).toUpperCase()}</div></div></header><div className="page-content"><div className="page-heading"><div><span className="eyebrow">{current.eyebrow}</span><h1>{current.title}</h1><p>{current.description}</p></div><div className="heading-date"><span>HÔM NAY</span><b>{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date())}</b></div></div>{selected === "overview" ? <><section className="welcome-banner"><div className="welcome-content"><span className="welcome-label"><span/> ACCESS MANAGEMENT PLATFORM</span><h2>Xin chào, {user?.name?.split(" ").at(-1) || "bạn"}.</h2><p>Quản lý luồng ra vào và dữ liệu chấm công trên một nền tảng thống nhất.</p>{canAccess(["ADMIN"], roles) && <button className="banner-button" onClick={() => select("employees")}>Mở quản lý nhân sự <ArrowRight size={15}/></button>}</div><div className="banner-graphic"><div className="graphic-ring ring-1"/><div className="graphic-ring ring-2"/><div className="graphic-core"><Fingerprint size={54}/></div><span className="graphic-tag"><ShieldCheck size={14}/> IDENTITY VERIFIED</span></div></section><div className="section-heading"><div><span className="eyebrow">OPERATIONS</span><h2>Truy cập nhanh</h2></div><span className="section-note">Chức năng theo quyền tài khoản</span></div><section className="module-grid">{visibleModules.filter(m => m.id !== "overview").map((m, i) => <button className="module-card" key={m.id} onClick={() => select(m.id)}><div className={`module-icon icon-${i}`}><m.icon size={20}/></div><div className="module-card-copy"><b>{m.title}</b><span>{m.description}</span></div><ArrowRight size={17} className="module-arrow"/></button>)}</section><section className="notice-card"><div className="notice-icon"><KeyRound size={18}/></div><div><b>Bảo mật phiên làm việc</b><p>Access token có thời hạn ngắn theo chính sách Identity. Nếu phiên hết hạn, hãy đăng nhập lại để tiếp tục thao tác.</p></div><span className="notice-status">OAUTH 2.0 · PKCE</span></section></> : <><section className="module-toolbar"><div className="toolbar-copy"><span className="toolbar-count">{visibleActions.length.toString().padStart(2,"0")}</span><span>Thao tác khả dụng<br/><small>Ch&#7885;n m&#7897;t nghi&#7879;p v&#7909; &#273;&#7875; ti&#7871;p t&#7909;c</small></span></div>{(factoryLoadError || stationLoadError) ? <p className="factory-load-error" role="alert">{[factoryLoadError, stationLoadError].filter(Boolean).join(" ")}</p> : (factoryOptions.length === 0 || stationOptions.length === 0) && <p className="factory-empty-note">{"D\u1ecbch v\u1ee5 nh\u00e0 m\u00e1y ho\u1eb7c tr\u1ea1m ch\u01b0a tr\u1ea3 v\u1ec1 d\u1eef li\u1ec7u. H\u00e3y t\u1ea3i l\u1ea1i trang ho\u1eb7c b\u00e1o qu\u1ea3n tr\u1ecb vi\u00ean."}</p>}<div className="toolbar-search"><Search size={16}/><input placeholder="Tìm thao tác" value={query} onChange={e => setQuery(e.target.value)}/></div></section><div className={`action-layout ${selected === "kiosk" && result?.action.path === "/access/simulator/scans" ? "action-layout-result" : ""}`}><section className="action-list" hidden={selected === "kiosk" && result?.action.path === "/access/simulator/scans"}>{visibleActions.filter(action => action.title.toLowerCase().includes(query.toLowerCase())).map((action, i) => <article className="action-card" key={action.title}><div className="action-title-row"><span className="action-index">{String(i+1).padStart(2,"0")}</span><h3>{action.title}</h3></div><EndpointForm action={action} factories={factoryOptions} stations={stationOptions} employees={employeeOptions} onDone={(data, status) => setResult({ data, status, action })}/></article>)}{visibleActions.filter(action => action.title.toLowerCase().includes(query.toLowerCase())).length === 0 && <div className="action-card"><p className="action-hint">Không tìm thấy thao tác phù hợp.</p></div>}</section><aside className={`response-panel ${selected === "kiosk" && result?.action.path === "/access/simulator/scans" ? "response-panel-result" : ""}`}><div className="response-header"><div><span className="eyebrow" >K&#7870;T QU&#7842;</span><h3>Kết quả thao tác</h3></div><button className="icon-button" title="Xóa kết quả" onClick={() => setResult(null)}><RefreshCw size={16}/></button></div>{result ? <><div className={`response-status ${result.status >= 400 || (result.action.path === "/access/simulator/scans" && unwrapData<{ scan?: { allowed?: boolean } }>(result.data)?.scan?.allowed === false) ? "response-failure" : ""}`}><span className="status-pulse"/> {result.action.path === "/access/simulator/scans" && unwrapData<{ scan?: { allowed?: boolean } }>(result.data)?.scan?.allowed === false ? "ACCESS DENIED" : "HO&#192;N T&#7844;T"}</div><OperationResultView action={result.action} data={result.data} factories={factoryOptions} stations={stationOptions} employees={employeeOptions} onContinue={() => setResult(null)}/></> : <div className="response-empty"><div className="empty-icon"><Activity size={22}/></div><b>Chưa có dữ liệu trả về</b><p>Kết quả API sẽ hiển thị tại đây sau khi bạn thực hiện thao tác.</p></div>}</aside></div><div className="module-filter">{filtered.filter(m => m.id !== selected && m.id !== "overview").map(m => <button key={m.id} onClick={() => select(m.id)}>{m.title}<ArrowRight size={14}/></button>)}</div></>}</div><footer className="footer"><span>TMC ACCESS CONTROL SYSTEM</span><span>OAUTH SESSION <i/> ACTIVE</span></footer></main></div>;
}

export default function App() { return <BrowserRouter><Routes><Route path="/login" element={<Login/>}/><Route path="/callback" element={<Callback/>}/><Route path="*" element={<Protected/>}/></Routes></BrowserRouter>; }
function Protected() { const token = useAuthStore(s => s.token); return token ? <Workspace/> : <Navigate to="/login" replace/>; }
