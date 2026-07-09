import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata = {
  metadataBase: new URL('https://github.com/CoderSerio/rush-fs'),
  title: { template: '%s | Rush-FS' },
  description:
    'API-aligned with Node.js fs for painless drop-in replacement. Get multi-fold performance in heavy file operations, powered by Rust.',
}

export default async function RootLayout({ children }) {
  const navbar = (
    <Navbar
      logo={<span className="font-bold">Rush-FS</span>}
      projectLink="https://github.com/CoderSerio/rush-fs"
      docsRepositoryBase="https://github.com/CoderSerio/rush-fs/tree/main/docs"
    />
  )
  const pageMap = await getPageMap()
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <Layout
          navbar={navbar}
          footer={<Footer>MIT {new Date().getFullYear()} © Rush-FS.</Footer>}
          pageMap={pageMap}
          editLink="Edit this page on GitHub"
          docsRepositoryBase="https://github.com/CoderSerio/rush-fs/blob/main/docs"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
