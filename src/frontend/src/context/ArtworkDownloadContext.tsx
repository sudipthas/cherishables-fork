import { createContext, useContext, useState } from "react";

interface ArtworkDownloadState {
  artworkUrl: string | null;
  isPaid: boolean;
  orderId: string | null;
  downloading: boolean;
  onDownload: (() => void) | null;
}

interface ArtworkDownloadContextValue extends ArtworkDownloadState {
  setArtworkDownload: (state: Partial<ArtworkDownloadState>) => void;
  clearArtworkDownload: () => void;
}

const defaultState: ArtworkDownloadState = {
  artworkUrl: null,
  isPaid: false,
  orderId: null,
  downloading: false,
  onDownload: null,
};

const ArtworkDownloadContext = createContext<ArtworkDownloadContextValue>({
  ...defaultState,
  setArtworkDownload: () => {},
  clearArtworkDownload: () => {},
});

export function ArtworkDownloadProvider({
  children,
}: { children: React.ReactNode }) {
  const [state, setState] = useState<ArtworkDownloadState>(defaultState);

  const setArtworkDownload = (next: Partial<ArtworkDownloadState>) =>
    setState((prev) => ({ ...prev, ...next }));

  const clearArtworkDownload = () => setState(defaultState);

  return (
    <ArtworkDownloadContext.Provider
      value={{ ...state, setArtworkDownload, clearArtworkDownload }}
    >
      {children}
    </ArtworkDownloadContext.Provider>
  );
}

export function useArtworkDownload() {
  return useContext(ArtworkDownloadContext);
}
