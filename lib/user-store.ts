let _fonditaId: string | null = null;

export function setFonditaId(id: string) {
  _fonditaId = id;
}

export function getFonditaId(): string | null {
  return _fonditaId;
}
