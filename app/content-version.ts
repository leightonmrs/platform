function stable(value: any): string {
 if(Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
 if(value && typeof value === 'object') return '{' + Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
 return JSON.stringify(value);
}
export async function contentVersion(value: unknown) {
 const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable(value)));
 return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
}
