export async function getWebsiteMetadata(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const imageUrl = extractOGImage(html);
    return {
      imageUrl: imageUrl || getFaviconUrl(url),
      title: extractOGTitle(html),
      description: extractOGDescription(html),
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

function extractOGImage(html: string): string | null {
  const match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (match?.[1]) {
    return match[1];
  }
  return null;
}

function extractOGTitle(html: string): string | null {
  const match = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (match?.[1]) {
    return match[1];
  }
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return titleMatch?.[1] || null;
}

function extractOGDescription(html: string): string | null {
  const match = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (match?.[1]) {
    return match[1];
  }
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return descMatch?.[1] || null;
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}/favicon.ico`;
  } catch {
    return '';
  }
}
