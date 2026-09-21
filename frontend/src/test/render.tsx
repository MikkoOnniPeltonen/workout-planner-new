import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/auth.context';

interface RenderOptions {
  /** URL the router starts at. */
  route?: string;
  /** Route pattern the element under test is mounted on. */
  path?: string;
  /** Other routes the element may navigate to. */
  extraRoutes?: Record<string, ReactElement>;
}

export function renderWithProviders(
  element: ReactElement,
  { route = '/', path = '/', extraRoutes = {} }: RenderOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const user = userEvent.setup();

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <Routes>
            <Route path={path} element={element} />
            {Object.entries(extraRoutes).map(([extraPath, extraElement]) => (
              <Route key={extraPath} path={extraPath} element={extraElement} />
            ))}
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { user, queryClient };
}
