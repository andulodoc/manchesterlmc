var NewsPreview = createClass({
  render: function() {
    var entry = this.props.entry;
    return h('article', { className: 'page-content' },
      h('header', { style: { padding: '2rem', borderBottom: '1px solid #eee' } },
        h('span', { style: { background: '#0d3d56', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' } },
          entry.getIn(['data', 'category'], '')
        ),
        h('h1', { style: { marginTop: '1rem' } }, entry.getIn(['data', 'title'], '')),
        h('p', { style: { color: '#666' } }, entry.getIn(['data', 'excerpt'], ''))
      ),
      h('div', { style: { padding: '2rem' } }, this.props.widgetFor('body'))
    );
  }
});

CMS.registerPreviewTemplate('news', NewsPreview);
