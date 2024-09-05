import { Logger } from '../../utils/logger.js';
import { filled_string } from '../../utils/validate.js';

export const questions_file = [
    [
        {
            type: 'input',
            message: `What's the scope and name of the file without extension?`,
            name: 'name',
            default: 'scope/File',
            validate: (value) => {
                if (!filled_string(value)) {
                    return 'This is required';
                }
                return true;
            }
        },
        {
            type: 'confirm',
            message: `Split file into *.svelte${Logger.color.dim(`, *.mjs, *.css`)}?`,
            name: 'wyvr_split_file',
            default: false
        },
        {
            type: 'list',
            message: 'Which rendering should the file have?',
            name: 'wyvr_render',
            default: 0,
            choices: [
                {
                    name: `Hydrate${Logger.color.dim(', Client Side Javascript a.k.a CSR')}`,
                    value: 'hydrate'
                },
                {
                    name: `Request${Logger.color.dim(', Rendered on Server, to add individual Content to statically generated pages ')}`,
                    value: 'request'
                },
                {
                    name: `Static${Logger.color.dim(', Only on Server')}`,
                    value: 'static'
                }
            ]
        }
    ],
    {
        _field: 'wyvr_render',
        _: [],
        hydrate: [
            [
                {
                    type: 'list',
                    message: 'When should the file be hydrated?',
                    name: 'wyvr_loading',
                    default: 0,
                    choices: [
                        {
                            name: `Lazy ${Logger.color.dim('When in viewport')}`,
                            value: 'lazy'
                        },
                        {
                            name: `Idle ${Logger.color.dim('When browser is idle')}`,
                            value: 'idle'
                        },
                        {
                            name: `Interact ${Logger.color.dim('When user interacts with it')}`,
                            value: 'interact'
                        },
                        {
                            name: 'Instant',
                            value: 'instant'
                        },
                        {
                            name: `Media ${Logger.color.dim('When media query matches')}`,
                            value: 'media'
                        },
                        {
                            name: `None ${Logger.color.dim('When function is executed')}`,
                            value: 'none'
                        }
                    ]
                }
            ],
            {
                _field: 'wyvr_loading',
                _: [],
                media: [
                    [
                        {
                            type: 'input',
                            message: `What's the media query?`,
                            name: 'wyvr_media',
                            default: '(min-width: 768px)',
                            validate: (value) => {
                                if (!filled_string(value)) {
                                    return 'This is required';
                                }
                                return true;
                            }
                        }
                    ]
                ],
                none: [
                    [
                        {
                            type: 'input',
                            message: `What's the name of the function?`,
                            name: 'wyvr_trigger',
                            validate: (value) => {
                                if (!filled_string(value)) {
                                    return 'This is required';
                                }
                                return true;
                            }
                        }
                    ]
                ]
            }
        ]
    }
];
