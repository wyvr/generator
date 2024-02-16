export const questions_type = [
    {
        type: 'list',
        message: 'What do you want to create?',
        name: 'type',
        default: 0,
        choices: [
            {
                name: `Project`,
                value: 'project'
            },
            {
                name: `Package`,
                value: 'package'
            },
            {
                name: `File`,
                value: 'file'
            },
            {
                name: `Config`,
                value: 'config'
            },
            {
                name: `Cron`,
                value: 'cron'
            },
            {
                name: `DDEV requirements`,
                value: 'ddev'
            }
        ]
    }
];
