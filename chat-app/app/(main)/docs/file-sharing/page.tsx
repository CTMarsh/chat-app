import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'File Sharing - ChatArk Documentation',
  description: 'Upload and share files in ChatArk conversations. Supported formats, size limits, virus scanning, and image previews.',
}

export default function FileSharingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">File Sharing</span>
          </nav>

          <h1 className="text-4xl font-bold mb-8">File Sharing</h1>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold mb-3">Supported File Types</h2>
              <p className="mb-3">
                ChatArk supports a wide range of file formats to accommodate different workflows. You can share files in any of the following categories:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li><span className="font-medium">Images:</span> JPEG, PNG, GIF, WebP, and HEIC</li>
                <li><span className="font-medium">Documents:</span> PDF, TXT, and RTF</li>
                <li><span className="font-medium">Archives:</span> ZIP and GZIP</li>
                <li><span className="font-medium">Audio:</span> MP3 and WAV</li>
                <li><span className="font-medium">Video:</span> MP4</li>
                <li><span className="font-medium">Presentations:</span> PPT and PPTX</li>
                <li><span className="font-medium">Spreadsheets:</span> XLS and XLSX</li>
              </ul>
              <p>
                If you attempt to upload a file type that is not on this list, the upload will be rejected with a message explaining which formats are accepted. This restriction helps protect recipients from potentially unsafe file types.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Size Limit</h2>
              <p>
                The maximum file size for any single upload is 50 MB. This limit applies to all file types, whether you are sharing an image, a document, or a video. If your file exceeds this limit, you will need to compress it or use an external file-sharing service and paste the link into your message instead. The size limit is enforced on the client side before the upload begins, so you will receive immediate feedback if a file is too large.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Virus Scanning</h2>
              <p className="mb-3">
                Every file uploaded to ChatArk goes through an automated virus scan before it is delivered to recipients. The scanning process uses ClamAV, an open-source antivirus engine, running as a Supabase Edge Function.
              </p>
              <p className="mb-3">
                Here is how the process works: when you select a file and confirm the upload, the client first validates the file type and size locally. The file is then sent to the server, where the Edge Function forwards it to the ClamAV scanning service. If the file is clean, it is stored in the message-attachments storage bucket and a message record is created in the conversation. If a threat is detected, the file is rejected immediately, never stored, and you receive a warning notification.
              </p>
              <p>
                This entire process typically completes in a few seconds. You will see a progress indicator while the file is being uploaded and scanned.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Viewing and Downloading Files</h2>
              <p>
                Shared files appear inline within the conversation. Clicking on a file opens a preview where available, or triggers a download for file types that cannot be previewed in the browser. You can also right-click (or long-press on mobile) a file attachment and select &quot;Download&quot; to save it to your device. All file downloads are served from Supabase Storage with authenticated URLs, ensuring that only conversation participants can access the files.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Image Previews</h2>
              <p>
                Image files receive special treatment in the chat view. When you share a JPEG, PNG, GIF, WebP, or HEIC image, a thumbnail preview is rendered directly in the message bubble. Clicking the thumbnail opens the full-resolution image in a lightbox overlay where you can zoom in, zoom out, and download the original. GIF images play their animation inline automatically. This preview behaviour makes it easy to share screenshots, photos, and visual assets without interrupting the conversation flow.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Avatar Uploads</h2>
              <p>
                Profile and group avatars use a separate storage bucket from message attachments. When you upload an avatar image from your profile settings or group settings, the image is automatically resized to a standard dimension to ensure consistent display across the application. Avatar images follow the same virus scanning process as message attachments. Supported avatar formats include JPEG, PNG, and WebP. The resized avatar is stored securely and served with caching headers for fast loading across all platforms.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border/50">
            <Link href="/docs" className="text-sm text-primary hover:underline">
              Back to Documentation
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
