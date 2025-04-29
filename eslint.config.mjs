
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginNext from '@next/eslint-plugin-next';

export default  [
	eslintConfigPrettier,
	...tseslint.configs.recommended,
	{
		plugins: {
		  '@next/next': pluginNext,
		},
		rules: {
		  ...pluginNext.configs.recommended.rules,
		  ...pluginNext.configs['core-web-vitals'].rules,
		},
	  },
]
