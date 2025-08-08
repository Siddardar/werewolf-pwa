export default function Head() {
  return (
    <>
      {/* PWA Manifest */}
      <link rel="manifest" href="/manifest" />
      {/* Safari PWA Support */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Werewolf PWA" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <meta name="theme-color" content="#F9FAFB" />
    </>
  );
}
