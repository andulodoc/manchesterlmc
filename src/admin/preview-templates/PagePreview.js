var PagePreview = createClass({
  render: function() {
    var entry = this.props.entry;
    var title = entry.getIn(['data', 'title'], '');
    var hero = entry.getIn(['data', 'hero']);
    var sections = entry.getIn(['data', 'sections']);

    return h('div', { style: { fontFamily: 'sans-serif', maxWidth: '860px', margin: '0 auto' } },
      h('section', { style: { background: '#0d3d56', color: 'white', padding: '3rem 2rem' } },
        h('h1', { style: { color: 'white', margin: 0 } },
          hero ? (hero.getIn(['heading']) || title) : title
        ),
        hero && hero.getIn(['subheading'])
          ? h('p', { style: { color: 'rgba(255,255,255,0.8)', marginTop: '1rem' } }, hero.getIn(['subheading']))
          : null
      ),
      sections ? sections.map(function(section, i) {
        var type = section.getIn(['type']);
        switch (type) {
          case 'markdown':
            return h('section', { key: i, style: { padding: '3rem 2rem', borderBottom: '1px solid #eee' } },
              section.getIn(['heading'])
                ? h('h2', { style: { color: '#0d3d56' } }, section.getIn(['heading']))
                : null,
              h('div', {}, this.props.widgetFor('sections.' + i + '.body') || '')
            );
          case 'callout':
            var style = section.getIn(['style'], 'info');
            var colors = { info: '#e8f4fd', warning: '#fff8e1', success: '#e8f5e9', neutral: '#f5f5f5' };
            return h('div', {
              key: i,
              style: { margin: '1rem 2rem', padding: '1rem 1.5rem', background: colors[style] || colors.info, borderRadius: '8px', borderLeft: '4px solid #1a7fa0' }
            }, h('div', {}, this.props.widgetFor('sections.' + i + '.text') || ''));
          case 'faq':
            return h('section', { key: i, style: { padding: '3rem 2rem', background: '#f9f9f9' } },
              section.getIn(['heading'])
                ? h('h2', { style: { color: '#0d3d56' } }, section.getIn(['heading']))
                : null,
              section.getIn(['items'])
                ? section.getIn(['items']).map(function(item, j) {
                    return h('details', { key: j, style: { marginBottom: '0.5rem', padding: '0.75rem', background: 'white', borderRadius: '6px' } },
                      h('summary', { style: { fontWeight: '600', cursor: 'pointer' } }, item.getIn(['q'])),
                      h('p', { style: { marginTop: '0.5rem', color: '#555' } }, item.getIn(['a']))
                    );
                  })
                : null
            );
          default:
            return h('div', {
              key: i,
              style: { margin: '1rem 2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '6px', color: '#666', fontStyle: 'italic' }
            }, '[' + type + ' block — preview not yet available]');
        }
      }.bind(this)) : null
    );
  }
});

CMS.registerPreviewTemplate('pages', PagePreview);
