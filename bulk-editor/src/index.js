import './style/style.sass';
import './style/button.sass';
import { SiteClient } from 'datocms-client';

window.DatoCmsPlugin.init((plugin) => {
  const dato = new SiteClient(plugin.parameters.global.apikey);
  plugin.startAutoResizer();
  const { field, locale, fieldPath } = plugin;

  const container = document.createElement('div');
  container.classList.add('container');
  const button = document.createElement('button');
  const spinner = document.createElement('span');

  button.id = ('DatoCMS-button--primary');
  button.textContent = `Apply to all ${field.attributes.localized ? `(${locale})` : ''}`;
  button.appendChild(spinner);
  spinner.id = ('spinner');
  container.appendChild(button);

  const query = {
    'filter[type]': plugin.itemType.id,
    version: 'current',
  };

  console.log(plugin.itemType);

  button.addEventListener('click', (event) => {
    if (!event.target.matches('#DatoCMS-button--primary')) return;
    event.preventDefault();

    /* eslint-disable */
    const confirm = window.confirm(`This action will overwrite all previous content for the "${field.attributes.label}" field belonging to all records of the ${plugin.itemType.attributes.name} model. Are you sure you want to proceed?`);
    /* eslint-enable */
    if (!confirm) {
      return;
    }
    if (plugin.itemType.singleton) throw new Error('This model is singleton');
    if (field.attributes.validators.unique) throw new Error('This field has an unique value constraint');
    button.disabled = true;
    button.classList.remove('done');
    button.classList.add('loading');

    dato.items.all(query, { allPages: true })
      .then((items) => {
        items.forEach((item) => {
          let updatedContent = {};

          if (field.attributes.localized) {
            updatedContent = {
              [field.attributes.api_key]: {
                ...item[field.attributes.api_key],
                [locale]: plugin.getFieldValue(fieldPath),
              },
            };
          } else {
            updatedContent = {
              [field.attributes.api_key]: plugin.getFieldValue(fieldPath),
            };
          }
          dato.items.update(item.id, updatedContent);
        });
      })
      .then(() => {
        button.disabled = false;
        button.classList.remove('loading');
        button.classList.add('done');
      })
      .catch((error) => {
        button.disabled = false;
        button.classList.remove('loading');
        button.classList.add('error');
        /* eslint-disable */
        alert(error);
        /* eslint-enable */
      });
  }, false);

  document.body.appendChild(container);
});