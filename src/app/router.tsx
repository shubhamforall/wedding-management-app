import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { AppShell } from '@/components/layout/AppShell';
import { MorePage } from '@/components/layout/MorePage';
import { NotFoundPage } from '@/components/layout/NotFoundPage';
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary';
import { FullPageSpinner } from '@/components/ui/Spinner';

// Route-level code splitting: every module page below is its own chunk,
// loaded only when its route is visited. Shell/layout/auth-guard stay
// eager since they're on the critical path for every session.

const WeddingListPage = lazy(() =>
  import('@/features/weddings/WeddingListPage').then((m) => ({ default: m.WeddingListPage }))
);
const CreateWeddingPage = lazy(() =>
  import('@/features/weddings/CreateWeddingPage').then((m) => ({ default: m.CreateWeddingPage }))
);
const AcceptInvitePage = lazy(() =>
  import('@/features/members/AcceptInvitePage').then((m) => ({ default: m.AcceptInvitePage }))
);

function WeddingListGate() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <WeddingListPage />
    </Suspense>
  );
}
function CreateWeddingGate() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <CreateWeddingPage />
    </Suspense>
  );
}
function AcceptInviteGate() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <AcceptInvitePage />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/auth/login',
    lazy: async () => ({ Component: (await import('@/features/auth/LoginPage')).LoginPage }),
  },
  {
    path: '/auth/signup',
    lazy: async () => ({ Component: (await import('@/features/auth/SignupPage')).SignupPage }),
  },
  {
    path: '/auth/forgot-password',
    lazy: async () => ({ Component: (await import('@/features/auth/ForgotPasswordPage')).ForgotPasswordPage }),
  },
  {
    path: '/auth/reset-password',
    lazy: async () => ({ Component: (await import('@/features/auth/ResetPasswordPage')).ResetPasswordPage }),
  },
  {
    path: '/auth/callback',
    lazy: async () => ({ Component: (await import('@/features/auth/AuthCallbackPage')).AuthCallbackPage }),
  },

  {
    path: '/',
    element: (
      <RequireAuth>
        <WeddingListGate />
      </RequireAuth>
    ),
  },
  {
    path: '/weddings/new',
    element: (
      <RequireAuth>
        <CreateWeddingGate />
      </RequireAuth>
    ),
  },
  {
    path: '/invite/:token',
    element: (
      <RequireAuth>
        <AcceptInviteGate />
      </RequireAuth>
    ),
  },
  {
    path: '/w/:weddingId',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/features/dashboard/DashboardPage')).DashboardPage }) },
      { path: 'guests', lazy: async () => ({ Component: (await import('@/features/guests/GuestsPage')).GuestsPage }) },
      {
        path: 'finance',
        lazy: async () => ({ Component: (await import('@/features/budget/FinanceTabs')).FinanceTabs }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import('@/features/budget/BudgetPage')).BudgetPage }) },
          { path: 'expenses', lazy: async () => ({ Component: (await import('@/features/expenses/ExpensesPage')).ExpensesPage }) },
        ],
      },
      { path: 'tasks', lazy: async () => ({ Component: (await import('@/features/tasks/TasksPage')).TasksPage }) },
      { path: 'more', element: <MorePage /> },
      { path: 'wedding-info', lazy: async () => ({ Component: (await import('@/features/weddingInfo/WeddingInfoPage')).WeddingInfoPage }) },
      { path: 'shopping', lazy: async () => ({ Component: (await import('@/features/shopping/ShoppingPage')).ShoppingPage }) },
      { path: 'inventory', lazy: async () => ({ Component: (await import('@/features/inventory/InventoryPage')).InventoryPage }) },
      { path: 'vendors', lazy: async () => ({ Component: (await import('@/features/vendors/VendorsPage')).VendorsPage }) },
      { path: 'timeline', lazy: async () => ({ Component: (await import('@/features/timeline/TimelinePage')).TimelinePage }) },
      { path: 'stay', lazy: async () => ({ Component: (await import('@/features/stay/StayPage')).StayPage }) },
      { path: 'contacts', lazy: async () => ({ Component: (await import('@/features/contacts/ContactsPage')).ContactsPage }) },
      { path: 'documents', lazy: async () => ({ Component: (await import('@/features/documents/DocumentsPage')).DocumentsPage }) },
      { path: 'members', lazy: async () => ({ Component: (await import('@/features/members/MembersPage')).MembersPage }) },
      { path: 'search', lazy: async () => ({ Component: (await import('@/features/search/SearchPage')).SearchPage }) },
      {
        path: 'notifications',
        lazy: async () => ({ Component: (await import('@/features/notifications/NotificationsPage')).NotificationsPage }),
      },
      { path: 'settings', lazy: async () => ({ Component: (await import('@/features/settings/SettingsPage')).SettingsPage }) },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
