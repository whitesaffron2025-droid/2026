(function(){
  'use strict';

  var Workflow = {
    current: 'dashboard',

    init: function(){
      var self = this;
      this.installNav();
      this.installEvents();
      this.patchRender();
      setTimeout(function(){ self.show('dashboard'); }, 800);
    },

    installNav: function(){
      var nav = document.querySelector('.nav');
      if(!nav) return;
      var items = [
        ['dashboard','Dashboard'],
        ['residents','Residents'],
        ['assign','Assign'],
        ['calls','Calls'],
        ['votes','Votes'],
        ['visits','Visits'],
        ['transport','Transport'],
        ['analytics','Analytics'],
        ['reports','Reports']
      ];
      nav.innerHTML = items.map(function(item){
        return '<button class="nav-btn workflow-btn" data-workflow="'+item[0]+'">'+item[1]+'</button>';
      }).join('');
    },

    installEvents: function(){
      var self = this;
      document.addEventListener('click', function(e){
        var btn = e.target.closest('[data-workflow]');
        if(btn){ self.show(btn.dataset.workflow); return; }
        var edit = e.target.closest('[data-workflow-edit]');
        if(edit){
          var row = self.rowById(edit.dataset.workflowEdit);
          if(row) self.openEditor(row);
          return;
        }
        var close = e.target.closest('[data-workflow-close]');
        if(close) self.closeEditor();
      });
      document.addEventListener('submit', function(e){
        if(e.target && e.target.id === 'workflowEditForm'){
          e.preventDefault();
          self.saveEditor(e.target);
        }
      });
      ['searchInput','partyFilter','pageSize'].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.addEventListener('input', function(){ if(self.isWorkflowList()) self.renderSection(); });
      });
    },

    patchRender: function(){
      var self = this;
      if(!window.CampaignApp || window.CampaignApp.__workflowPatched) return;
      var originalRender = window.CampaignApp.render.bind(window.CampaignApp);
      window.CampaignApp.render = function(){
        var out = originalRender();
        if(self.isWorkflowList()) self.renderSection();
        return out;
      };
      window.CampaignApp.__workflowPatched = true;
    },

    isWorkflowList: function(){
      return ['residents','assign','calls','votes','visits','transport'].indexOf(this.current) >= 0;
    },

    show: function(section){
      this.current = section || 'dashboard';
      document.querySelectorAll('[data-workflow]').forEach(function(b){ b.classList.toggle('active', b.dataset.workflow === section); });
      if(section === 'dashboard') return this.showOriginalView('dashboard');
      if(section === 'analytics') return this.showOriginalView('analytics');
      if(section === 'reports') return this.showOriginalView('reports');
      this.showOriginalView('campaigns');
      this.renderSection();
    },

    showOriginalView: function(viewName){
      document.querySelectorAll('.view').forEach(function(v){ v.classList.remove('active'); });
      var view = document.getElementById(viewName + 'View');
      if(view) view.classList.add('active');
      var toolbar = document.getElementById('filter-bar');
      if(toolbar) toolbar.style.display = this.isWorkflowList() ? '' : (viewName === 'campaigns' ? '' : 'none');
    },

    rows: function(){
      return (window.CampaignState && window.CampaignState.rows) ? window.CampaignState.rows.slice() : [];
    },

    text: function(v){
      return String(v || '').trim();
    },

    lower: function(v){
      return this.text(v).toLowerCase();
    },

    matchesBaseFilters: function(row){
      var q = this.lower(document.getElementById('searchInput') && document.getElementById('searchInput').value);
      var party = document.getElementById('partyFilter') ? document.getElementById('partyFilter').value : 'all';
      if(party !== 'all' && this.text(row.party).toUpperCase() !== party) return false;
      if(q){
        var hay = [row.name,row.national_id,row.phone,row.house,row.lives_in,row.living_place,row.party,row.remarks,row.vote_assigned_by].map(this.lower.bind(this)).join(' ');
        if(hay.indexOf(q) === -1) return false;
      }
      return true;
    },

    sectionRows: function(section){
      var self = this;
      return this.rows().filter(function(row){
        if(!self.matchesBaseFilters(row)) return false;
        if(section === 'assign') return !!self.text(row.vote_assigned_by);
        if(section === 'calls') return (row.phone_status || 'need-call') === 'need-call';
        if(section === 'votes') return (row.vote_status || 'not-decided') === 'will-vote';
        if(section === 'visits') return (row.d2d_status || 'not-visited') === 'not-visited';
        if(section === 'transport') return (row.transport_status || 'not-needed') === 'need-transport';
        return true;
      }).sort(function(a,b){
        return self.text(a.house).localeCompare(self.text(b.house), undefined, {numeric:true}) || self.text(a.name).localeCompare(self.text(b.name));
      });
    },

    metrics: function(){
      var rows = this.rows();
      var self = this;
      return {
        residents: rows.length,
        assigned: rows.filter(function(r){ return !!self.text(r.vote_assigned_by); }).length,
        needCall: rows.filter(function(r){ return (r.phone_status || 'need-call') === 'need-call'; }).length,
        willVote: rows.filter(function(r){ return (r.vote_status || 'not-decided') === 'will-vote'; }).length,
        notVisited: rows.filter(function(r){ return (r.d2d_status || 'not-visited') === 'not-visited'; }).length,
        needTransport: rows.filter(function(r){ return (r.transport_status || 'not-needed') === 'need-transport'; }).length
      };
    },

    title: function(section){
      return {
        residents:'Residents',
        assign:'Assigned Voters',
        calls:'Need Call',
        votes:'Will Vote',
        visits:'Need D2D Visit',
        transport:'Need Transport'
      }[section] || 'Residents';
    },

    renderSection: function(){
      var section = this.current;
      var rows = this.sectionRows(section);
      var m = this.metrics();
      var title = document.getElementById('recordsTitle');
      var count = document.getElementById('recordCount');
      if(title) title.textContent = this.title(section);
      if(count) count.textContent = rows.length.toLocaleString('en-US') + ' records';
      var summary = document.getElementById('activeFilterSummary');
      if(summary) summary.innerHTML = this.summaryHtml(m, section);
      var bulk = document.getElementById('bulkToolbar');
      if(bulk) bulk.style.display = 'none';
      var head = document.getElementById('recordsHead');
      if(head) head.innerHTML = '<tr><th>Name</th><th>House</th><th>Phone</th><th>Party</th><th>Status</th><th>Assign</th><th>Action</th></tr>';
      var body = document.getElementById('table-body');
      if(body) body.innerHTML = this.rowsHtml(rows, section);
      var pager = document.getElementById('pagination');
      if(pager) pager.style.display = 'none';
    },

    summaryHtml: function(m, active){
      var cards = [
        ['residents','Residents',m.residents],
        ['assign','Assigned',m.assigned],
        ['calls','Need Call',m.needCall],
        ['votes','Will Vote',m.willVote],
        ['visits','Not Visited',m.notVisited],
        ['transport','Need Transport',m.needTransport]
      ];
      return '<div class="workflow-summary">'+cards.map(function(c){
        return '<button class="badge '+(active===c[0]?'ok':'')+'" data-workflow="'+c[0]+'">'+c[1]+': <b>'+Number(c[2]||0).toLocaleString('en-US')+'</b></button>';
      }).join(' ')+'</div>';
    },

    rowsHtml: function(rows, section){
      var self = this;
      if(!rows.length) return '<tr><td colspan="7">No records found for this section.</td></tr>';
      return rows.map(function(row){
        var phone = self.text(row.phone);
        return '<tr>'+ 
          '<td><b>'+self.escape(row.name || 'No name')+'</b><br><small>'+self.escape(row.national_id || 'No ID')+'</small></td>'+ 
          '<td>'+self.escape(row.house || '-')+'</td>'+ 
          '<td>'+(phone?'<a href="tel:'+self.escapeAttr(phone)+'">'+self.escape(phone)+'</a>':'-')+'</td>'+ 
          '<td>'+self.badge(row.party)+'</td>'+ 
          '<td>'+self.statusCell(row, section)+'</td>'+ 
          '<td>'+(self.text(row.vote_assigned_by) || '<span class="badge warn">Unassigned</span>')+'</td>'+ 
          '<td><button class="primary" data-workflow-edit="'+Number(row.id)+'">Update</button></td>'+ 
        '</tr>';
      }).join('');
    },

    statusCell: function(row, section){
      if(section === 'assign') return this.badge(row.vote_assigned_by ? 'assigned' : 'unassigned');
      if(section === 'calls') return this.badge(row.phone_status || 'need-call');
      if(section === 'votes') return this.badge(row.vote_status || 'not-decided');
      if(section === 'visits') return this.badge(row.d2d_status || 'not-visited');
      if(section === 'transport') return this.badge(row.transport_status || 'not-needed');
      return this.badge(row.vote_status || 'not-decided') + ' ' + this.badge(row.phone_status || 'need-call') + ' ' + this.badge(row.d2d_status || 'not-visited');
    },

    badge: function(value){
      var v = this.escape(value || '-');
      return '<span class="badge">'+v+'</span>';
    },

    rowById: function(id){
      return this.rows().find(function(r){ return String(r.id) === String(id); });
    },

    openEditor: function(row){
      var dialog = document.getElementById('editDialog');
      if(!dialog) return;
      dialog.innerHTML = this.editorHtml(row, this.current);
      dialog.showModal();
    },

    editorHtml: function(row, section){
      return '<form id="workflowEditForm" class="modal-card" data-id="'+Number(row.id)+'" data-section="'+this.escapeAttr(section)+'">'+
        '<div class="modal-head"><div><h2>'+this.escape(this.title(section))+' Update</h2><small>'+this.escape(row.name||'No name')+' • '+this.escape(row.house||'-')+' • '+this.escape(row.phone||'No phone')+'</small></div><button type="button" class="secondary" data-workflow-close>Close</button></div>'+
        '<div class="modal-grid">'+this.editorFields(row, section)+'</div>'+ 
        '<div class="modal-actions"><button type="button" class="secondary" data-workflow-close>Cancel</button><button type="submit" class="primary">Save</button></div>'+ 
      '</form>';
    },

    editorFields: function(row, section){
      if(section === 'assign') return this.field('Assigned To','<input name="vote_assigned_by" value="'+this.escapeAttr(row.vote_assigned_by||'')+'" placeholder="Name">') + this.remarks(row);
      if(section === 'calls') return this.field('Call Status', this.select('phone_status', row.phone_status || 'need-call', [['need-call','Need Call'],['called','Called'],['busy','Busy'],['not-answer','Not Answer'],['disconnected','Disconnected'],['wrong-number','Wrong Number'],['out-of-coverage','Out of Coverage'],['no-phone','No Phone']])) + this.field('Reach Status', this.select('reach_status', row.reach_status || 'not-reached', [['not-reached','Not Reached'],['reached','Reached']])) + this.remarks(row);
      if(section === 'votes') return this.field('Vote Status', this.select('vote_status', row.vote_status || 'not-decided', [['not-decided','Not Decided'],['will-vote','Will Vote'],['not-vote','Not Vote']])) + this.field('Support Level', this.select('support_level', row.support_level || 'normal', [['normal','Normal'],['not-guaranteed','Not Guaranteed'],['guaranteed','Guaranteed']])) + this.remarks(row);
      if(section === 'visits') return this.field('D2D Status', this.select('d2d_status', row.d2d_status || 'not-visited', [['not-visited','Not Visited'],['reach','Reached / Visited'],['not-home','Not Home'],['live-in-another-place','Live in Another Place']])) + this.field('Living Place','<input name="living_place" value="'+this.escapeAttr(row.living_place||'')+'" placeholder="Living place">') + this.remarks(row);
      if(section === 'transport') return this.field('Transport Status', this.select('transport_status', row.transport_status || 'not-needed', [['not-needed','Not Needed'],['need-transport','Need Transport'],['arranged','Arranged'],['picked-up','Picked Up']])) + this.remarks(row);
      return this.field('Vote Status', this.select('vote_status', row.vote_status || 'not-decided', [['not-decided','Not Decided'],['will-vote','Will Vote'],['not-vote','Not Vote']])) + this.field('Call Status', this.select('phone_status', row.phone_status || 'need-call', [['need-call','Need Call'],['called','Called'],['busy','Busy'],['not-answer','Not Answer'],['wrong-number','Wrong Number'],['no-phone','No Phone']])) + this.field('D2D Status', this.select('d2d_status', row.d2d_status || 'not-visited', [['not-visited','Not Visited'],['reach','Reached / Visited'],['not-home','Not Home'],['live-in-another-place','Live in Another Place']])) + this.field('Transport Status', this.select('transport_status', row.transport_status || 'not-needed', [['not-needed','Not Needed'],['need-transport','Need Transport'],['arranged','Arranged'],['picked-up','Picked Up']])) + this.field('Assigned To','<input name="vote_assigned_by" value="'+this.escapeAttr(row.vote_assigned_by||'')+'" placeholder="Name">') + this.remarks(row);
    },

    remarks: function(row){
      return this.field('Remarks','<textarea name="remarks" rows="4" placeholder="Remarks">'+this.escape(row.remarks||'')+'</textarea>');
    },

    field: function(label, html){
      return '<label class="modal-field"><span>'+this.escape(label)+'</span>'+html+'</label>';
    },

    select: function(name, current, options){
      var self = this;
      return '<select name="'+this.escapeAttr(name)+'">'+options.map(function(o){
        return '<option value="'+self.escapeAttr(o[0])+'" '+(o[0]===current?'selected':'')+'>'+self.escape(o[1])+'</option>';
      }).join('')+'</select>';
    },

    patchFor: function(form){
      var section = form.dataset.section || 'residents';
      var data = Object.fromEntries(new FormData(form).entries());
      var patch = {};
      function clean(v){ return String(v || '').trim(); }
      if(section === 'assign' || section === 'residents'){
        if(Object.prototype.hasOwnProperty.call(data,'vote_assigned_by')){
          patch.vote_assigned_by = clean(data.vote_assigned_by) || null;
          patch.vote_assigned_at = patch.vote_assigned_by ? new Date().toISOString() : null;
        }
      }
      if(section === 'calls' || section === 'residents'){
        if(data.phone_status) patch.phone_status = data.phone_status;
        if(data.reach_status) patch.reach_status = data.reach_status;
        if(patch.phone_status === 'called') patch.reach_status = 'reached';
        if(patch.phone_status === 'need-call') patch.reach_status = 'not-reached';
      }
      if(section === 'votes' || section === 'residents'){
        if(data.vote_status) patch.vote_status = data.vote_status;
        if(data.support_level) patch.support_level = data.support_level;
        if(patch.vote_status === 'will-vote' || patch.support_level === 'guaranteed') patch.reach_status = 'reached';
        if(patch.vote_status === 'not-vote' || patch.vote_status === 'not-decided') patch.reach_status = 'not-reached';
      }
      if(section === 'visits' || section === 'residents'){
        if(data.d2d_status) patch.d2d_status = data.d2d_status;
        if(Object.prototype.hasOwnProperty.call(data,'living_place')) patch.living_place = clean(data.living_place) || null;
      }
      if(section === 'transport' || section === 'residents'){
        if(data.transport_status) patch.transport_status = data.transport_status;
      }
      if(Object.prototype.hasOwnProperty.call(data,'remarks')) patch.remarks = clean(data.remarks) || null;
      return patch;
    },

    saveEditor: async function(form){
      var id = form.dataset.id;
      var patch = this.patchFor(form);
      if(!id || !Object.keys(patch).length) return;
      try{
        var rows = await window.CampaignApi.updateRecord(id, patch);
        var updated = rows && rows[0] ? rows[0] : Object.assign({id:id}, patch);
        var stateRows = window.CampaignState.rows;
        var index = stateRows.findIndex(function(r){ return String(r.id) === String(id); });
        if(index >= 0) stateRows[index] = Object.assign({}, stateRows[index], updated);
        this.closeEditor();
        this.renderSection();
        alert('Saved successfully.');
      }catch(err){
        alert('Save failed: ' + (err.message || err));
      }
    },

    closeEditor: function(){
      var dialog = document.getElementById('editDialog');
      if(dialog && dialog.open) dialog.close();
    },

    escape: function(v){
      return String(v || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
    },
    escapeAttr: function(v){ return this.escape(v).replace(/`/g,'&#96;'); }
  };

  function start(){
    var tries = 0;
    var timer = setInterval(function(){
      tries++;
      if(window.CampaignApp && window.CampaignState && window.CampaignApi){
        clearInterval(timer);
        window.CampaignWorkflow = Workflow;
        Workflow.init();
      }
      if(tries > 60) clearInterval(timer);
    },100);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();