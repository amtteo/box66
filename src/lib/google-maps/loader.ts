/** Bootstrap + importLibrary pre Maps JavaScript API (Places API New). */

declare global {
  interface Window {
    __box66GoogleMapsBootstrapped?: boolean;
  }
}

function installBootstrap(apiKey: string): void {
  if (typeof window === "undefined" || window.__box66GoogleMapsBootstrapped) return;

  const config = JSON.stringify({
    key: apiKey,
    v: "weekly",
    language: "sk",
    region: "SK",
  });

  const script = document.createElement("script");
  script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})(${config});`;
  document.head.appendChild(script);
  window.__box66GoogleMapsBootstrapped = true;
}

export async function importPlacesLibrary() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY nie je nastavený.");
  }

  installBootstrap(apiKey);

  if (!window.google?.maps?.importLibrary) {
    await new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (window.google?.maps?.importLibrary) {
          resolve();
          return;
        }
        if (Date.now() - started > 15_000) {
          reject(new Error("Google Maps sa nepodarilo načítať."));
          return;
        }
        window.setTimeout(tick, 50);
      };
      tick();
    });
  }

  return google.maps.importLibrary("places") as Promise<google.maps.PlacesLibrary>;
}
