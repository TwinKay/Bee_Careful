import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import prettierConfig from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig, 
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react': reactPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // 1. 컴포넌트 네이밍 (PascalCase)
      'react/jsx-pascal-case': 'error',
      
      // 2. 변수 및 함수 네이밍 (camelCase)
      '@typescript-eslint/naming-convention': [
        'error',
        // 기본 변수 및 함수는 camelCase
        {
          'selector': 'variable',
          'format': ['camelCase'],
          'leadingUnderscore': 'allow',
          'filter': {
            // 상수와 React 컴포넌트 제외
            'regex': '^[A-Z]|^[A-Z][A-Z0-9_]*$',
            'match': false
          }
        },
        {
          'selector': 'function',
          'format': ['camelCase'],
          'leadingUnderscore': 'allow',
          'filter': {
            // React 컴포넌트와 커스텀 훅 제외
            'regex': '^[A-Z]|^use[A-Z]',
            'match': false
          }
        },
        
        // 3. 상수 네이밍 (UPPER_CASE)
        {
          'selector': 'variable',
          'modifiers': ['const', 'global'],
          'format': ['UPPER_CASE'],
          'filter': {
            'regex': '^[A-Z][A-Z0-9_]*$',
            'match': true
          }
        },
        
        // 4. React 커스텀 훅 네이밍 (use로 시작)
        {
          'selector': 'function',
          'filter': {
            'regex': '^use[A-Z]',
            'match': true
          },
          'format': ['camelCase']
        },
        
        // React 컴포넌트는 PascalCase
        {
          'selector': ['function', 'variable'],
          'filter': {
            'regex': '^[A-Z][a-zA-Z0-9]*$',
            'match': true
          },
          'format': ['PascalCase']
        },
        
        // 5. 타입 및 인터페이스 네이밍 (PascalCase + Type 접미사)
        {
          'selector': 'interface',
          'format': ['PascalCase'],
          'suffix': ['Type']
        },
        {
          'selector': 'typeAlias',
          'format': ['PascalCase'],
          'suffix': ['Type']
        }
      ],
      
      // 6. 불필요한 타입 제거
      '@typescript-eslint/no-inferrable-types': 'warn',
      
      // 7. any 타입 지양
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // 8. JSX 속성 스타일
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-spacing': ['error', {'when': 'never'}],
      'react/jsx-tag-spacing': ['error', {
        'closingSlash': 'never',
        'beforeSelfClosing': 'always',
        'afterOpening': 'never',
        'beforeClosing': 'never'
      }],
      
      // 9. 사용하지 않는 변수 및 파라미터 경고
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
      }],
      
      // 10. 주석 스타일
      'no-warning-comments': ['warn', {
        'terms': ['TODO', 'FIXME'],
        'location': 'start'
      }],
      
      // 코드 가독성 및 일관성 규칙
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/explicit-function-return-type': "off",
      
      // 코드 호이스팅 방지
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error'],
      
      // 스타일 관련 규칙 (Prettier와 충돌하지 않는 부분)
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  }
]