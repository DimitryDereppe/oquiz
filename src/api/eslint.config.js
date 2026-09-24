// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'semi': ['error', 'always'], // ; obligatoire en fin d'instruction
      'indent': ['error', 2], // L'intentation du code doit être de 2
      '@typescript-eslint/no-explicit-any': 'off',  // on autorise any partout pour se faciliter la vie en tant que débutant
    },
  },
  {
    ignores: ["dist"]
  }, 
);