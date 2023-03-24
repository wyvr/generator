/* Created with wyvr {{version}} */
export default async function ({ cron, env, initial, rel_path, path }) {
    return [
        {
            url: '/page',
            title: 'Generated while building',
            content: `
                environment: ${env}<br>
                relative path: ${rel_path}<br>
                absolute path: ${path}<br>
                generated from cron: ${cron}<br>
                generated while initial building: ${initial}<br>
                `,
        },
    ];
}
