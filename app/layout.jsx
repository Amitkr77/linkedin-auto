import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import ToastProvider from '@/components/ToastProvider';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'LinkedIn Automation',
  description: 'Schedule and auto-publish LinkedIn posts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
