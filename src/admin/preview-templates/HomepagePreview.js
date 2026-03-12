var HomepagePreview = createClass({
  render: function() {
    var entry = this.props.entry;
    var hero = entry.getIn(['data', 'hero']);
    var roleCards = entry.getIn(['data', 'roleCards']);
    var stats = entry.getIn(['data', 'stats']);
    var serviceCards = entry.getIn(['data', 'serviceCards']);
    var newsletter = entry.getIn(['data', 'newsletter']);

    return h('div', { style: { fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', color: '#333' } },

      // Hero
      h('section', { style: { background: '#0d3d56', color: 'white', padding: '3rem 2rem' } },
        hero && hero.getIn(['eyebrow'])
          ? h('p', { style: { color: '#e07b39', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' } }, hero.getIn(['eyebrow']))
          : null,
        h('h1', { style: { color: 'white', margin: '0 0 1rem', fontSize: '2rem' } },
          hero ? hero.getIn(['heading'], '') : ''
        ),
        hero && hero.getIn(['lead'])
          ? h('p', { style: { color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '1.5rem' } }, hero.getIn(['lead']))
          : null,
        hero && hero.getIn(['ctas'])
          ? h('div', { style: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' } },
              hero.getIn(['ctas']).map(function(cta, i) {
                var isPrimary = cta.getIn(['style'], 'primary') === 'primary';
                return h('span', {
                  key: i,
                  style: {
                    padding: '0.6rem 1.25rem',
                    background: isPrimary ? '#e07b39' : 'transparent',
                    border: isPrimary ? 'none' : '2px solid white',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }
                }, cta.getIn(['label'], ''));
              })
            )
          : null
      ),

      // Role Cards
      roleCards && roleCards.size > 0
        ? h('section', { style: { padding: '2rem', background: '#f9f9f9' } },
            h('p', { style: { color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', marginBottom: '1rem' } }, 'I am a…'),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' } },
              roleCards.map(function(card, i) {
                return h('div', { key: i, style: { background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #ddd', borderTop: '3px solid #1a7fa0' } },
                  h('div', { style: { fontWeight: '700', color: '#0d3d56', marginBottom: '0.25rem' } }, card.getIn(['title'], '')),
                  h('div', { style: { fontSize: '0.8rem', color: '#666' } }, card.getIn(['subtitle'], ''))
                );
              })
            )
          )
        : null,

      // Stats
      stats && stats.size > 0
        ? h('section', { style: { padding: '2rem', background: '#0d3d56', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' } },
            stats.map(function(stat, i) {
              return h('div', { key: i, style: { textAlign: 'center', color: 'white' } },
                h('div', { style: { fontSize: '2rem', fontWeight: '700', color: '#e07b39' } }, stat.getIn(['number'], '')),
                h('div', { style: { fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem' } }, stat.getIn(['label'], ''))
              );
            })
          )
        : null,

      // Service Cards
      serviceCards && serviceCards.size > 0
        ? h('section', { style: { padding: '2rem' } },
            h('h2', { style: { color: '#0d3d56', marginBottom: '1.5rem' } }, 'How We Support You'),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' } },
              serviceCards.map(function(card, i) {
                return h('div', { key: i, style: { background: '#f9f9f9', padding: '1.25rem', borderRadius: '8px', border: '1px solid #eee' } },
                  h('div', { style: { fontWeight: '700', color: '#0d3d56', marginBottom: '0.5rem' } }, card.getIn(['title'], '')),
                  h('p', { style: { fontSize: '0.875rem', color: '#555', margin: '0 0 0.75rem' } }, card.getIn(['text'], '')),
                  h('span', { style: { fontSize: '0.8rem', color: '#1a7fa0', fontWeight: '600' } }, card.getIn(['linkText'], 'Learn more') + ' →')
                );
              })
            )
          )
        : null,

      // Newsletter
      newsletter
        ? h('section', { style: { padding: '2rem', background: '#e8f4fd', borderTop: '4px solid #1a7fa0' } },
            h('h2', { style: { color: '#0d3d56', marginBottom: '0.5rem' } }, newsletter.getIn(['title'], '')),
            newsletter.getIn(['description'])
              ? h('p', { style: { color: '#444', marginBottom: '0.75rem' } }, newsletter.getIn(['description']))
              : null,
            newsletter.getIn(['issueLabel'])
              ? h('p', { style: { fontSize: '0.875rem', color: '#1a7fa0', fontWeight: '600' } }, newsletter.getIn(['issueLabel']))
              : null
          )
        : null
    );
  }
});

CMS.registerPreviewTemplate('homepage', HomepagePreview);
