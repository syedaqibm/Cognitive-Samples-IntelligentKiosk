export const metadata = {
  title: "Neighborhood Marketplace API",
  description: "Backend for the neighborhood home-grown marketplace mobile app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
