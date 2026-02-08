
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginNext from '@next/eslint-plugin-next';

export default  [
	{
		ignores: [
			'.next/**',
			'node_modules/**',
			'out/**',
			'.vercel/**',
			'next-env.d.ts',
		],
	},
	eslintConfigPrettier,
	...tseslint.configs.recommended,
	{
		plugins: {
		  '@next/next': pluginNext,
		},
		rules: {
		  ...pluginNext.configs.recommended.rules,
		  ...pluginNext.configs['core-web-vitals'].rules,
		  '@typescript-eslint/no-unused-vars': [
			'error',
			{
			  argsIgnorePattern: '^_',
			  varsIgnorePattern: '^_',
			},
		  ],
		},
	  },
]
