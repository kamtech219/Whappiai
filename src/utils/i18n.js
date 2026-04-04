const i18next = require('i18next');
const en = require('../locales/en.json');
const fr = require('../locales/fr.json');

i18next.init({
    fallbackLng: 'fr',
    resources: {
        en: { translation: en },
        fr: { translation: fr }
    }
});

module.exports = i18next;
