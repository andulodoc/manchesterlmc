var PagePreview = createClass({
  render: function() {
    var entry = this.props.entry;
    var title = entry.getIn(['data', 'title'], '');
    var hero = entry.getIn(['data', 'hero']);
    var sections = entry.getIn(['data', 'sections']);

    return h('div', { style: { fontFamily: 'sans-serif', maxWidth: '860px', margin: '0 auto' } },

      // Hero
      h('section', { style: { background: '#0d3d56', color: 'white', padding: '3rem 2rem' } },
        h('h1', { style: { color: 'white', margin: 0 } },
          hero ? (hero.getIn(['heading']) || title) : title
        ),
        hero && hero.getIn(['subheading'])
          ? h('p', { style: { color: 'rgba(255,255,255,0.8)', marginTop: '1rem' } }, hero.getIn(['subheading']))
          : null
      ),

      // Sections
      sections ? sections.map(function(section, i) {
        var type = section.getIn(['type']);

        if (type === 'markdown') {
          return h('section', { key: i, style: { padding: '2rem', borderBottom: '1px solid #eee' } },
            section.getIn(['heading'])
              ? h('h2', { style: { color: '#0d3d56' } }, section.getIn(['heading']))
              : null,
            h('p', { style: { color: '#444', whiteSpace: 'pre-wrap' } }, section.getIn(['body'], ''))
          );
        }

        if (type === 'callout') {
          var style = section.getIn(['style'], 'info');
          var bg = { info: '#e8f4fd', warning: '#fff8e1', success: '#e8f5e9', neutral: '#f5f5f5' };
          return h('div', { key: i, style: { margin: '1rem 2rem', padding: '1rem 1.5rem', background: bg[style] || bg.info, borderRadius: '8px', borderLeft: '4px solid #1a7fa0' } },
            h('p', { style: { margin: 0 } }, section.getIn(['text'], ''))
          );
        }

        if (type === 'cards') {
          var items = section.getIn(['items']);
          return h('section', { key: i, style: { padding: '2rem', background: '#f9f9f9' } },
            section.getIn(['heading'])
              ? h('h2', { style: { color: '#0d3d56', marginBottom: '1rem' } }, section.getIn(['heading']))
              : null,
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' } },
              items ? items.map(function(item, j) {
                return h('div', { key: j, style: { background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' } },
                  h('strong', { style: { color: '#0d3d56' } }, item.getIn(['title'], '')),
                  h('p', { style: { fontSize: '0.875rem', color: '#555', margin: '0.5rem 0 0' } }, item.getIn(['text'], ''))
                );
              }) : null
            )
          );
        }

        if (type === 'faq') {
          var faqItems = section.getIn(['items']);
          return h('section', { key: i, style: { padding: '2rem', background: '#f9f9f9' } },
            section.getIn(['heading'])
              ? h('h2', { style: { color: '#0d3d56' } }, section.getIn(['heading']))
              : null,
            faqItems ? faqItems.map(function(item, j) {
              return h('details', { key: j, style: { marginBottom: '0.5rem', padding: '0.75rem', background: 'white', borderRadius: '6px' } },
                h('summary', { style: { fontWeight: '600', cursor: 'pointer' } }, item.getIn(['q'], '')),
                h('p', { style: { marginTop: '0.5rem', color: '#555' } }, item.getIn(['a'], ''))
              );
            }) : null
          );
        }

        if (type === 'button_row') {
          var buttons = section.getIn(['buttons']);
          return h('div', { key: i, style: { padding: '1rem 2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' } },
            buttons ? buttons.map(function(btn, j) {
              return h('span', { key: j, style: { padding: '0.5rem 1.25rem', background: '#0d3d56', color: 'white', borderRadius: '6px', fontSize: '0.9rem' } },
                btn.getIn(['label'], '')
              );
            }) : null
          );
        }

        if (type === 'columns') {
          var cols = section.getIn(['items']);
          return h('div', { key: i, style: { padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(' + (section.getIn(['count'], '2')) + ', 1fr)', gap: '2rem' } },
            cols ? cols.map(function(col, j) {
              return h('div', { key: j, style: { color: '#444', whiteSpace: 'pre-wrap', fontSize: '0.9rem' } }, col.getIn(['body'], ''));
            }) : null
          );
        }

        // Fallback for image, listing, etc.
        return h('div', { key: i, style: { margin: '1rem 2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '6px', color: '#666', fontStyle: 'italic' } },
          '[' + type + ' block]'
        );

      }) : null
    );
  }
});

CMS.registerPreviewTemplate('pages', PagePreview);
