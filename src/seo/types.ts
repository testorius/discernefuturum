export interface OpenGraphImage {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
    type?: string;
  }
  
  export interface SEOProps {
    title: string;
    description: string;
    siteName?: string;
    image?: string | OpenGraphImage;
    canonicalURL?: string | URL;
    noindex?: boolean;
    article?: boolean;
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    section?: string;
    og?: {
      title?: string;
      description?: string;
      image?: string | OpenGraphImage;
      type?: 'website' | 'article' | 'profile';
      locale?: string;
      siteName?: string;
    };
    twitter?: {
      card?: 'summary' | 'summary_large_image' | 'app' | 'player';
      title?: string;
      description?: string;
      image?: string | OpenGraphImage;
      creator?: string;
      site?: string;
    };
    alternates?: {
      canonical?: string;
      languages?: Record<string, string>;
      media?: Record<string, string>;
      types?: Record<string, string>;
    };
    jsonLd?: Record<string, any>;
  }
 