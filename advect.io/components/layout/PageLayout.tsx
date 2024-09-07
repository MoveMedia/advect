import React from 'react';


export interface PageProps {
  title?: string,
  metas?: { [key: string]: string },
  children?: React.ReactNode;
  header_children?: React.ReactNode;
  footer_children?: React.ReactNode;
  head_assets?: React.ReactNode;
  footer_assets?: React.ReactNode;
}
export default function PageLayout(props: PageProps): React.ReactElement {
  const metas = props.metas ?? {};
  const title = props.title ?? 'Page Title';
  return <> 
  <html hidden>
    <head>
      {props.head_assets}
      {
        Object.keys(metas ?? {}).map((key) => {
          return <meta key={key} name={key} content={metas[key]} />
        })
      }
      <title>{title}</title>
    </head>
    <body>
      <header>
        {props.header_children}
      </header>
      <main>
        {props.children}
      </main>
      <footer>
        {props.footer_children}
        {props.footer_assets}
      </footer>
    </body>
    </html>
  </>;
}