declare module 'slugify' {
  interface Options {
    replacement?: string;
    remove?: RegExp;
    lower?: boolean;
    strict?: boolean;
    locale?: string;
    trim?: boolean;
  }

  function slugify(string: string, options?: string | Options): string;

  namespace slugify {
    function extend(mapping: Record<string, string>): void;
  }

  export default slugify;
}
