window.CampaignHelpers = {
  sections: ['dashboard', 'residents', 'assign', 'calls', 'votes', 'visits', 'transport', 'reports'],

  defaults: {
    vote_status: 'not-decided',
    support_level: 'normal',
    phone_status: 'need-call',
    d2d_status: 'not-visited',
    transport_status: 'not-needed',
    reach_status: 'not-reached'
  },

  text(value) {
    return String(value || '').trim();
  },

  value(value, fallback) {
    const clean = this.text(value);
    return clean || fallback;
  },

  escape(value) {
    return this.text(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  },

  validSection(section) {
    return this.sections.indexOf(section) >= 0 ? section : 'dashboard';
  },

  shorten(value, limit) {
    const clean = this.text(value);
    return clean.length > limit ? clean.slice(0, limit - 1) + '…' : clean;
  },

  badge(value, type) {
    return `<span class="badge ${type || ''}">${this.escape(value)}</span>`;
  },

  option(value, label, current) {
    return `<option value="${this.escape(value)}" ${this.value(current, '') === value ? 'selected' : ''}>${this.escape(label)}</option>`;
  },

  select(name, current, options) {
    const self = this;
    return `<select name="${self.escape(name)}">${options.map(function (item) {
      return self.option(item[0], item[1], current);
    }).join('')}</select>`;
  },

  field(label, html) {
    return `<label class="modal-field">${this.escape(label)}${html}</label>`;
  },

  remarksField(row) {
    return this.field('Remarks', `<textarea name="remarks" rows="4" placeholder="Write remarks here">${this.escape(row.remarks)}</textarea>`);
  }
};
