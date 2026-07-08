'use client';
interface HtmlPreviewProps {
  previewHtml?: string;
  className?: string;
  iframeClassName?: string;
}

export default function HtmlPreview({ previewHtml = '<h1>Hello Newsletter!</h1>', className, iframeClassName }: HtmlPreviewProps) {
  return (
    <>
      <div className={`border rounded bg-white p-4 mt-2 ${className} `} style={{ height: '90vh' }}>
        <iframe title="HTML Preview" srcDoc={previewHtml} className={`w-full h-full border-none ${iframeClassName}`} style={{ height: '100%' }} />
      </div>
    </>
  );
}
