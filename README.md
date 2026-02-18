# 🚀 React + TypeScript + Shadcn UI Starter Kit

The ultimate boilerplate for building modern, scalable, and beautiful web applications. Pre-configured with **React Query**, **Axios**, and **Shadcn UI**, so you can focus on building features, not setting up build tools.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🌟 Features

*   **⚡ Faster Development**: Powered by [Vite](https://vitejs.dev/) for instant server start and HMR.
*   **🎨 Stunning UI**: Built with [Shadcn UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/) for fully accessible and customizable components.
*   **📡 Robust Data Fetching**: Pre-configured [TanStack Query (React Query)](https://tanstack.com/query/latest) for caching, synchronization, and server state management.
*   **🔗 Type-Safe API Calls**: Integrated [Axios](https://axios-http.com/) service with interceptors for streamlined HTTP requests and automatic error handling.
*   **🛡️ TypeScript Native**: Strict type checking enabled for better code quality and developer experience.
*   **🧩 Modular Architecture**: Organized project structure for scalability and maintainability.

## 🛠️ Getting Started

Follow these steps to get your project up and running in minutes.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ghostshreyash/vite-react-shadcn-template.git my-awesome-app
    cd my-awesome-app
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory. You can copy the structure from the example below:

    ```env
    VITE_API_BASE_URL=http://localhost:3000/api
    ```
    > **Note:** The application requires `VITE_API_BASE_URL` to be defined in your `.env` file for API calls to work.

4.  **Start the development server**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

```text
src/
├── components/         # Reusable UI components
│   ├── ui/             # Shadcn UI primitives (Button, Input, etc.)
│   └── ...             # Custom application components
├── lib/                # Utility functions and shadcn utils
├── services/           # API integration logic
│   ├── api.ts          # Central Axios instance with interceptors
│   └── auth.api.ts     # Example auth service module
├── App.tsx             # Main application component
├── main.tsx            # Entry point (Providers setup)
└── index.css           # Global styles and Tailwind configuration
```

## 🔌 API & Data Fetching

### Axios Service (`src/services/api.ts`)
We use a centralized Axios instance to handle all HTTP requests.
*   **Base URL**: Configured via environment variables (`VITE_API_BASE_URL`).
*   **Interceptors**: 
    *   *Request*: Ready for you to add token attachment logic (Authorization header).
    *   *Response*: Global error logging is pre-configured to help debug issues.

### React Query Integration
The application is wrapped in `QueryClientProvider` in `src/main.tsx`. You can use hooks like `useQuery` and `useMutation` immediately in any component.

**Example Usage:**

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiSignIn } from '@/services/auth.api'; // Your service function

// In your component
const { data, isLoading, error } = useQuery({
  queryKey: ['user-profile'],
  queryFn: fetchUserProfile,
});
```

## 🎨 Styling with Shadcn UI

This template uses **Shadcn UI**, which is not a component library you install as a single dependency. Instead, it allows you to copy and paste beautifully designed components into your project.

*   **Add new components**:
    ```bash
    npx shadcn@latest add [component-name]
    # Example: npx shadcn@latest add button
    ```
    This adds the component code directly to your `src/components/ui` folder, giving you full control to customize it.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
