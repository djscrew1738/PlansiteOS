module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'build',
        'ci',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      ['api', 'worker', 'web', 'vision', 'db', 'ai-core', 'contracts', 'shared', 'infra', 'deps'],
    ],
  },
};
