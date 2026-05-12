import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/Landing";
import ChatPage from "@/pages/ChatPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#34d399",
    colorForeground: "#ecfdf5",
    colorMutedForeground: "#6ee7b7",
    colorDanger: "#f87171",
    colorBackground: "#050e0a",
    colorInput: "#0a1a10",
    colorInputForeground: "#ecfdf5",
    colorNeutral: "#065f46",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.85rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "w-[440px] max-w-full overflow-hidden rounded-2xl border border-emerald-900/40 shadow-2xl",
    card: "!shadow-none !border-0 !rounded-none",
    footer: "!shadow-none !border-0 !rounded-none",
    headerTitle: { color: "#ecfdf5", fontWeight: "700" },
    headerSubtitle: { color: "#6ee7b7" },
    socialButtonsBlockButtonText: { color: "#ecfdf5" },
    socialButtonsBlockButton: {
      background: "rgba(10,26,16,0.7)",
      border: "1px solid rgba(52,211,153,0.25)",
      color: "#ecfdf5",
    },
    formFieldLabel: { color: "#a7f3d0" },
    formFieldInput: {
      background: "rgba(5,15,10,0.8)",
      border: "1px solid rgba(52,211,153,0.25)",
      color: "#ecfdf5",
    },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
      color: "#052e16",
      fontWeight: "600",
    },
    footerActionLink: { color: "#34d399" },
    footerActionText: { color: "#6ee7b7" },
    footerAction: { background: "transparent" },
    dividerText: { color: "#6ee7b7" },
    dividerLine: { background: "rgba(52,211,153,0.2)" },
    logoBox: "flex justify-center py-2",
    logoImage: { height: "36px" },
    identityPreviewEditButton: { color: "#34d399" },
    formFieldSuccessText: { color: "#34d399" },
    alertText: { color: "#ecfdf5" },
    alert: {
      background: "rgba(10,26,16,0.8)",
      border: "1px solid rgba(52,211,153,0.2)",
    },
    otpCodeFieldInput: {
      background: "rgba(5,15,10,0.8)",
      border: "1px solid rgba(52,211,153,0.25)",
      color: "#ecfdf5",
    },
    formFieldRow: {},
    main: { background: "rgba(5,14,10,0.92)", backdropFilter: "blur(20px)" },
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(20,100,70,0.2) 0%, transparent 70%), #050e0a" }}>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(20,100,70,0.2) 0%, transparent 70%), #050e0a" }}>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/chat" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedChat() {
  return (
    <>
      <Show when="signed-in">
        <ChatPage />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/chat" component={ProtectedChat} />
            <Route path="/chat/:id" component={ProtectedChat} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
