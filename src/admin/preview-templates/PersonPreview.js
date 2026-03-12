var PersonPreview = createClass({
  render: function() {
    var entry = this.props.entry;
    var photo = entry.getIn(['data', 'photo']);
    return h('div', { style: { maxWidth: '360px', padding: '1.5rem', border: '1px solid #eee', borderRadius: '12px', fontFamily: 'sans-serif' } },
      photo
        ? h('img', { src: this.props.getAsset(photo).toString(), style: { width: '100%', borderRadius: '8px', marginBottom: '1rem' } })
        : h('div', {
            style: { width: '100%', aspectRatio: '1', background: '#e8f0f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#0d3d56', fontSize: '3rem' }
          }, '?'),
      h('div', { style: { color: '#1a7fa0', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' } },
        entry.getIn(['data', 'role'], '')
      ),
      h('div', { style: { color: '#0d3d56', fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.75rem' } },
        entry.getIn(['data', 'title'], '')
      ),
      h('div', { style: { color: '#555', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' } },
        this.props.widgetFor('body')
      ),
      entry.getIn(['data', 'email'])
        ? h('a', {
            href: 'mailto:' + entry.getIn(['data', 'email']),
            style: { color: '#1a7fa0', fontSize: '0.875rem' }
          }, entry.getIn(['data', 'email']))
        : null
    );
  }
});

CMS.registerPreviewTemplate('people', PersonPreview);
