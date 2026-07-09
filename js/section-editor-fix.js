(function(){
  'use strict';

  function ready(fn){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }

  ready(function(){
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      if(window.CampaignModals&&window.CampaignActions&&window.CampaignUtils){
        clearInterval(timer);
        applyPatch();
      }
      if(tries>40) clearInterval(timer);
    },100);
  });

  function applyPatch(){
    var M=window.CampaignModals;
    var A=window.CampaignActions;
    var U=window.CampaignUtils;
    if(M.__sectionEditorPatched) return;
    M.__sectionEditorPatched=true;

    function option(value,label,current){
      return M.option(value,label,current);
    }
    function field(label,html){
      return M.field(label,html);
    }
    function text(v){
      return U.text(v);
    }

    function context(){
      var status=(document.getElementById('statusFilter')?.value||'all');
      var d2d=(document.getElementById('d2dFilter')?.value||'all');
      var call=(document.getElementById('callStatusFilter')?.value||'all');
      var outcome=(document.getElementById('callOutcomeFilter')?.value||'all');
      var assigner=(document.getElementById('assignerFilter')?.value||'all');
      if(assigner!=='all'||status==='unassigned') return 'assign';
      if(call!=='all'||outcome!=='all'||['need-call','called'].includes(status)) return 'calls';
      if(['will-vote','not-vote','not-decided'].includes(status)) return 'votes';
      if(d2d!=='all'||status==='not-visited') return 'visits';
      if(status==='need-transport') return 'transport';
      return 'residents';
    }

    function titleFor(type){
      return {
        residents:'Full Resident Update',
        assign:'Assign Resident',
        calls:'Call Center Update',
        votes:'Vote Update',
        visits:'D2D Visit Update',
        transport:'Transport Update'
      }[type]||'Update Resident';
    }

    function rowMeta(row){
      return '<div class="modal-head"><div><h2>'+titleFor(context())+'</h2><small>'+text(row.name||'No name')+' • '+text(row.house||'-')+' • '+text(row.phone||'No phone')+' • '+text(row.national_id||'No ID')+'</small></div><button type="button" class="secondary" data-close-modal>Close</button></div>';
    }

    function voteFields(row){
      var vote=row.vote_status||'not-decided';
      var reach=vote==='will-vote'?'reached':(row.reach_status||'not-reached');
      var disabled=vote==='will-vote'?'disabled':'';
      return [
        field('Vote Status','<select name="vote_status" id="modalVoteStatus">'+option('not-decided','Not Decided',vote)+option('will-vote','Will Vote',vote)+option('not-vote','Not Vote',vote)+'</select>'),
        field('Reach Status','<select name="reach_status" id="modalReachStatus" '+disabled+'>'+option('not-reached','Not Reached',reach)+option('reached','Reached',reach)+'</select><small id="reachStatusNote">Will Vote auto-sets Reach Status to Reached.</small>'),
        field('Support Level','<select name="support_level">'+option('normal','Normal',row.support_level||'normal')+option('not-guaranteed','Not Guaranteed',row.support_level)+option('guaranteed','Guaranteed',row.support_level)+'</select>')
      ];
    }

    function callFields(row){
      return [
        field('Call Status','<select name="phone_status">'+option('need-call','Need Call',row.phone_status||'need-call')+option('called','Called',row.phone_status)+option('busy','Busy',row.phone_status)+option('switched-off','Switched Off',row.phone_status)+option('not-answer','Not Answer',row.phone_status)+option('disconnected','Disconnected',row.phone_status)+option('wrong-number','Wrong Number',row.phone_status)+option('out-of-coverage','Out of Coverage',row.phone_status)+option('out-of-range','Out of Range',row.phone_status)+option('no-phone','No Phone',row.phone_status)+'</select>'),
        field('Reach Status','<select name="reach_status" id="modalReachStatus">'+option('not-reached','Not Reached',row.reach_status||'not-reached')+option('reached','Reached',row.reach_status)+'</select>'),
        field('Call Outcome','<select name="call_outcome">'+option('','No Outcome',row.call_outcome||'')+option('promised-to-vote','Promised to Vote',row.call_outcome)+option('undecided','Undecided',row.call_outcome)+option('will-not-vote','Will Not Vote',row.call_outcome)+option('callback','Callback',row.call_outcome)+option('no-answer','No Answer',row.call_outcome)+'</select>'),
        field('Call Agent','<input name="call_center_agent" value="'+text(row.call_center_agent)+'" placeholder="Agent name">'),
        field('Call Attempts','<input name="call_attempts" type="number" min="0" value="'+Number(row.call_attempts||0)+'">'),
        field('Callback Scheduled','<input name="callback_scheduled_at" type="datetime-local" value="'+(row.callback_scheduled_at?String(row.callback_scheduled_at).slice(0,16):'')+'">'),
        field('Call Notes','<textarea name="call_notes" rows="3" placeholder="Call notes">'+text(row.call_notes)+'</textarea>')
      ];
    }

    function assignFields(row){
      return [
        field('Assigned To','<input name="vote_assigned_by" value="'+text(row.vote_assigned_by)+'" placeholder="Name">'),
        field('Remarks','<textarea name="remarks" rows="4" placeholder="Remarks">'+text(row.remarks)+'</textarea>')
      ];
    }

    function visitFields(row){
      return [
        field('D2D Status','<select name="d2d_status">'+option('not-visited','Not Visited',row.d2d_status||'not-visited')+option('reach','Reached / Visited',row.d2d_status)+option('not-home','Not Home',row.d2d_status)+option('live-in-another-place','Live in Another Place',row.d2d_status)+'</select>'),
        field('Living Place','<input name="living_place" value="'+text(row.living_place)+'" placeholder="Living place">'),
        field('Remarks','<textarea name="remarks" rows="4" placeholder="Remarks">'+text(row.remarks)+'</textarea>')
      ];
    }

    function transportFields(row){
      return [
        field('Transport Status','<select name="transport_status">'+option('not-needed','Not Needed',row.transport_status||'not-needed')+option('need-transport','Need Transport',row.transport_status)+option('arranged','Arranged',row.transport_status)+option('picked-up','Picked Up',row.transport_status)+'</select>'),
        field('Remarks','<textarea name="remarks" rows="4" placeholder="Remarks">'+text(row.remarks)+'</textarea>')
      ];
    }

    function fullFields(row){
      return [].concat(voteFields(row),callFields(row),visitFields(row),transportFields(row),assignFields(row));
    }

    function fieldsFor(row,type){
      if(type==='assign') return assignFields(row);
      if(type==='calls') return callFields(row);
      if(type==='votes') return voteFields(row).concat(field('Remarks','<textarea name="remarks" rows="4" placeholder="Remarks">'+text(row.remarks)+'</textarea>'));
      if(type==='visits') return visitFields(row);
      if(type==='transport') return transportFields(row);
      return fullFields(row);
    }

    M.renderEditModal=function(row){
      var type=context();
      var fields=fieldsFor(row,type).join('');
      return '<form id="editForm" class="modal-card" data-record-id="'+Number(row.id)+'" data-editor-section="'+type+'">'+rowMeta(row)+'<div class="modal-grid">'+fields+'</div><div class="modal-actions"><button type="button" class="secondary" data-close-modal>Cancel</button><button type="submit" class="primary">Save</button></div></form>';
    };

    A.buildUpdatePatch=function(form){
      var data=Object.fromEntries(new FormData(form).entries());
      var patch={election_review_updated_at:new Date().toISOString()};
      function has(k){return Object.prototype.hasOwnProperty.call(data,k);}
      function clean(k){return String(data[k]||'').trim();}
      if(has('vote_status')) patch.vote_status=data.vote_status||'not-decided';
      if(has('phone_status')) patch.phone_status=data.phone_status||'need-call';
      if(has('d2d_status')) patch.d2d_status=data.d2d_status||'not-visited';
      if(has('reach_status')) patch.reach_status=data.reach_status||'not-reached';
      if(has('support_level')) patch.support_level=data.support_level||'normal';
      if(has('transport_status')) patch.transport_status=data.transport_status||'not-needed';
      if(has('vote_assigned_by')){patch.vote_assigned_by=clean('vote_assigned_by')||null; patch.vote_assigned_at=patch.vote_assigned_by?new Date().toISOString():null;}
      if(has('living_place')) patch.living_place=clean('living_place')||null;
      if(has('remarks')) patch.remarks=clean('remarks')||null;
      if(has('call_attempts')) patch.call_attempts=data.call_attempts===''?0:Number(data.call_attempts||0);
      if(has('call_duration')) patch.call_duration=data.call_duration===''?null:Number(data.call_duration||0);
      if(has('call_notes')) patch.call_notes=clean('call_notes')||null;
      if(has('callback_scheduled_at')) patch.callback_scheduled_at=data.callback_scheduled_at||null;
      if(has('call_center_agent')) patch.call_center_agent=clean('call_center_agent')||null;
      if(has('call_outcome')) patch.call_outcome=data.call_outcome||null;
      if(has('sms_sent')) patch.sms_sent=data.sms_sent==='on';
      if(has('email_sent')) patch.email_sent=data.email_sent==='on';
      if(patch.vote_status==='will-vote'||patch.support_level==='guaranteed') patch.reach_status='reached';
      if(patch.vote_status==='not-vote'||patch.vote_status==='not-decided'||patch.phone_status==='need-call') patch.reach_status='not-reached';
      if(patch.phone_status&&patch.phone_status!=='need-call'){
        patch.call_attempts=Math.max(Number(patch.call_attempts||0),1);
        patch.last_call_at=new Date().toISOString();
      }
      if(patch.phone_status==='called') patch.reach_status='reached';
      if(patch.phone_status==='called'&&patch.call_outcome==='promised-to-vote'){
        patch.vote_status='will-vote';
        patch.reach_status='reached';
      }
      return patch;
    };

    console.log('[Patch] Section-specific campaign editor applied');
  }
})();