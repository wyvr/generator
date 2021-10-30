import { IObject } from './object';

export interface IIdentifier {
    file: IIdentifierFile;
    dependency: IIdentifierDependency;
}

export interface IIdentifierFile {
    name: string;
    doc: string;
    layout: string;
    page: string;
    shortcodes?: string[];
}
export interface IIdentifierDependency extends IObject {
    doc: IObject;
    layout: IObject;
    page: IObject;
    ___shortcode___?: IObject;
}
export interface IIdentifierEmit {
    type: string;
    identifier: string;
    doc: string;
    layout: string;
    page: string;
}

/*
Sample:
{
  file: {
    name: 'default_default_startpage',
    doc: 'doc/Default.svelte',
    layout: 'layout/Default.svelte',
    page: 'page/Startpage.svelte'
  },
  dependency: {
    doc: { 'doc/Default.svelte': [Array], 'doc/Htaccess.svelte': [Array] },
    layout: { 'layout/Default.svelte': [Array] },
    page: {
      'page/Search.svelte': [Array],
      'page/Startpage.svelte': [Array],
      'page/Test.svelte': [Array],
      'page/routes/Service.svelte': [Array]
    },
    ___shortcode___: { 'about/index.html': [Array], 'index.html': [Array] },
    component: {
      'component/Header.svelte': [Array],
      'component/ServiceBox.svelte': [Array],
      'component/content/Slider.svelte': [Array],
      'component/remixicon/Include.svelte': [Array],
      'component/search/Page.svelte': [Array]
    },
    form: { 'form/Password.svelte': [Array], 'form/Text.svelte': [Array] },
    test: {
      'test/HydrateStore.svelte': [Array],
      'test/HydrateStoreModify.svelte': [Array],
      'test/OnDemandMedia.svelte': [Array],
      'test/StaticStore.svelte': [Array],
      'test/TypeScript.svelte': [Array]
    }
  }
}
*/
