// Redirige `Text` y `TextInput` de 'react-native' a components/app-text para que
// toda la app use la fuente de interfaz sin tocar cada pantalla.
module.exports = function appTextImports({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        if (path.node.source.value !== 'react-native' || path.node.importKind === 'type') return;
        const file = state.filename || '';
        if (file.includes('node_modules') || file.endsWith('app-text.tsx')) return;
        const moved = path.node.specifiers.filter((s) => t.isImportSpecifier(s) && s.importKind !== 'type'
          && (s.imported.name === 'Text' || s.imported.name === 'TextInput'));
        if (!moved.length) return;
        path.node.specifiers = path.node.specifiers.filter((s) => !moved.includes(s));
        path.insertAfter(t.importDeclaration(moved, t.stringLiteral('@/components/app-text')));
        if (!path.node.specifiers.length) path.remove();
      },
    },
  };
};
