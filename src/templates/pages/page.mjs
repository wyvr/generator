/* Created with wyvr {{version}} */
import { get_name } from '@wyvr/generator/src/vars/env.js';

export default async function ({ cron, env, initial, rel_path, path, pkg }) {
    return [
        {
            url: '/page',
            title: 'Generated while building',
            content: `
                <table>
                    <tr>
                        <td>environment</td>
                        <td><b>${get_name(env)}</b> <code>${env}</code></td>
                    </tr>
                    <tr>
                        <td>relative path</td>
                        <td><code>${rel_path}</code></td>
                    </tr>
                    <tr>
                        <td>absolute path</td>
                        <td><code>${path}</code></td>
                    </tr>
                    <tr>
                        <td>package</td>
                        <td><b>${pkg.name}</b> <code>${pkg.path}</code></td>
                    </tr>
                    <tr>
                        <td>generated while initial building</td>
                        <td><code>${initial}</code></td>
                    </tr>
                    <tr>
                        <td>generated from cron</td>
                        <td><code>${!!cron}</code></td>
                    </tr>
                </table>
                `,
        },
    ];
}
