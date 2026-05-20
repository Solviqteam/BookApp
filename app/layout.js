export const metadata = {
  title: "Book Insights",
  description: "Get key ideas from any book instantly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}