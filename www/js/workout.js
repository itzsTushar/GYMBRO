const Workout = {
  selectedDate: new Date(),
  init() {
    this.selectedDate = new Date();
    this.selectedDate.setHours(0,0,0,0);
    document.getElementById("addWorkoutExercise").addEventListener("click", () => this.addSelectedExercise());
    document.getElementById("todayWorkoutList").addEventListener("change", event => {
      const checkbox = event.target.closest("[data-set-index]");
      if (checkbox) this.toggleSet(checkbox.dataset.itemId, Number(checkbox.dataset.setIndex), checkbox.checked);
    });
    document.getElementById("todayWorkoutList").addEventListener("click", event => {
      const button = event.target.closest("[data-remove-item]");
      if (button) this.removeItem(button.dataset.removeItem);
    });
    document.getElementById("weekPlanner").addEventListener("click", event => {
      const button = event.target.closest("[data-plan-date]");
      if (button) this.selectDate(button.dataset.planDate);
    });
    document.getElementById("workoutDayType").addEventListener("change", event => this.setDayType(event.target.value));
    this.render();
  },
  dateKey(date=this.selectedDate) { return Streak.dateKey(date); },
  parseDate(key) { const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d); },
  getLibraryExercises() {
    const result=[];
    ExerciseLibrary.categories.forEach(category => category.exercises.forEach(exercise => result.push({category,exercise})));
    return result;
  },
  getRecord(key=this.dateKey()) {
    const daily=Storage.getDaily();
    return daily[key] || {items:[], dayType:this.defaultDayType(this.parseDate(key))};
  },
  defaultDayType(date) { return date.getDay()===0 ? "rest" : date.getDay()===6 ? "optional" : "work"; },
  getDayType(key, record) { return record?.dayType || this.defaultDayType(this.parseDate(key)); },
  renderSelector() {
    const select=document.getElementById("workoutExerciseSelect");
    select.innerHTML='<option value="">Choose an exercise</option>';
    const exercises=this.getLibraryExercises();
    exercises.forEach(({category,exercise})=>{
      const option=document.createElement("option");
      option.value=`${category.id}::${exercise.id}`;
      option.textContent=`${category.name} — ${exercise.name}`;
      select.appendChild(option);
    });
    document.getElementById("workoutLibraryEmpty").classList.toggle("hidden",exercises.length>0);
    select.disabled=exercises.length===0;
    document.getElementById("addWorkoutExercise").disabled=exercises.length===0;
  },
  addSelectedExercise() {
    const select=document.getElementById("workoutExerciseSelect");
    if(!select.value){showToast("Choose an exercise first.");return;}
    const [categoryId,exerciseId]=select.value.split("::");
    const found=this.getLibraryExercises().find(x=>x.category.id===categoryId&&x.exercise.id===exerciseId);
    if(!found){showToast("Exercise not found.");this.renderSelector();return;}
    const {category,exercise}=found, isCardio=category.type==="cardio";
    const sets=isCardio?1:Math.max(1,Number(exercise.sets)||1);
    const daily=Storage.getDaily(), key=this.dateKey();
    const record=daily[key]||{items:[],dayType:this.defaultDayType(this.selectedDate)};
    if(!Array.isArray(record.items))record.items=[];
    record.items.push({
      id:"day_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
      libraryExerciseId:exercise.id,categoryId:category.id,categoryName:category.name,
      name:exercise.name,type:category.type,weight:Number(exercise.weight)||0,
      reps:Number(exercise.reps)||0,sets,duration:Number(exercise.duration)||0,
      distance:Number(exercise.distance)||0,notes:exercise.notes||"",completedSets:Array(sets).fill(false)
    });
    this.recalculate(record); daily[key]=record; Storage.saveDaily(daily);
    select.value="";this.render();this.refreshDashboard();showToast("Exercise added to selected day.");
  },
  setDayType(type) {
    const daily=Storage.getDaily(),key=this.dateKey();
    const record=daily[key]||{items:[]};
    record.dayType=type;daily[key]=record;Storage.saveDaily(daily);
    this.renderWeek();this.renderProgress(record);
    if(type==="rest")showToast("Marked as a rest day.");
  },
  toggleSet(itemId,setIndex,checked) {
    const daily=Storage.getDaily(),key=this.dateKey(),record=daily[key];
    if(!record||!Array.isArray(record.items))return;
    const item=record.items.find(x=>x.id===itemId);if(!item)return;
    if(!Array.isArray(item.completedSets))item.completedSets=Array(item.sets).fill(false);
    item.completedSets[setIndex]=checked;this.recalculate(record);daily[key]=record;
    Storage.saveDaily(daily);this.renderProgress(record);this.renderWeek();this.refreshDashboard();
  },
  removeItem(itemId) {
    if(!confirm("Remove this exercise from the selected workout?"))return;
    const daily=Storage.getDaily(),key=this.dateKey(),record=daily[key];if(!record)return;
    record.items=(record.items||[]).filter(x=>x.id!==itemId);
    if(!record.items.length && !record.dayType)delete daily[key];else{this.recalculate(record);daily[key]=record;}
    Storage.saveDaily(daily);this.render();this.refreshDashboard();showToast("Exercise removed.");
  },
  recalculate(record) {
    let total=0,done=0;
    (record.items||[]).forEach(item=>{
      const sets=Math.max(1,Number(item.sets)||1);
      if(!Array.isArray(item.completedSets))item.completedSets=Array(sets).fill(false);
      while(item.completedSets.length<sets)item.completedSets.push(false);
      item.completedSets=item.completedSets.slice(0,sets);
      total+=sets;done+=item.completedSets.filter(Boolean).length;
    });
    record.totalSets=total;record.completedSets=done;
    record.completed=total>0&&done===total;
    record.summary=record.completed?`${record.items.length} exercises completed`:`${done} of ${total} sets completed`;
  },
  selectDate(key) {
    this.selectedDate=this.parseDate(key);
    this.render();
  },
  renderWeek() {
    const holder=document.getElementById("weekPlanner");if(!holder)return;
    const daily=Storage.getDaily(),today=new Date();today.setHours(0,0,0,0);
    holder.innerHTML="";
    for(let i=0;i<7;i++){
      const date=new Date(today);date.setDate(today.getDate()+i);
      const key=Streak.dateKey(date),record=daily[key],type=this.getDayType(key,record);
      const complete=Boolean(record?.completed),items=record?.items?.length||0;
      const card=document.createElement("button");card.type="button";
      card.className="week-day-card"+(key===this.dateKey()?" selected":"");
      card.dataset.planDate=key;
      const state=complete?"Completed":type==="rest"?"Rest day":type==="optional"?"Optional day":items?`${items} planned`:"Working day";
      card.innerHTML=`<span class="week-day-name">${date.toLocaleDateString("en-IN",{weekday:"short"})}</span><strong>${date.toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</strong><small>${state}</small>`;
      holder.appendChild(card);
    }
  },
  render() {
    this.renderSelector();this.renderWeek();
    const key=this.dateKey(),record=this.getRecord(key),isFuture=this.selectedDate>new Date(new Date().setHours(0,0,0,0));
    document.getElementById("selectedWorkoutDate").textContent=this.selectedDate.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    document.getElementById("workoutDayType").value=this.getDayType(key,record);
    document.getElementById("addWorkoutExercise").textContent=isFuture?"+ Add to planned workout":"+ Add to today's workout";
    document.getElementById("workoutPlanHint").textContent=isFuture?"Plan your exercises in advance. Progress tracking becomes available on that date.":"Track each set as you complete it.";
    const holder=document.getElementById("todayWorkoutList");
    if(!record.items||!record.items.length){
      holder.innerHTML=`<div class="workout-empty"><div class="placeholder-icon">＋</div><h3>${this.getDayType(key,record)==="rest"?"Rest day":"No exercises planned yet"}</h3><p>${this.getDayType(key,record)==="rest"?"Enjoy your recovery. You can change this day type or add exercises.":"Add exercises from your exercise library."}</p></div>`;
      this.renderProgress(null);return;
    }
    holder.innerHTML=record.items.map(item=>{
      const isCardio=item.type==="cardio",details=isCardio?`${item.duration} min · ${item.distance} km`:`${item.weight?item.weight+" kg · ":""}${item.reps} reps · ${item.sets} sets`;
      const checks=Array.from({length:item.sets},(_,index)=>{
        const done=Boolean(item.completedSets?.[index]);
        return `<label class="workout-set ${done?"is-done":""}"><input type="checkbox" data-item-id="${item.id}" data-set-index="${index}" ${done?"checked":""} ${isFuture?"disabled":""}><span>${isCardio?"Complete cardio target":"Set "+(index+1)}</span></label>`;
      }).join("");
      return `<article class="workout-item"><div class="workout-item-top"><div><span class="workout-category">${this.escape(item.categoryName)}</span><h3>${this.escape(item.name)}</h3><p class="workout-item-detail">${this.escape(details)}</p>${item.notes?`<p class="workout-item-notes">${this.escape(item.notes)}</p>`:""}</div><button type="button" class="small-icon-btn delete-action" data-remove-item="${item.id}" title="Remove exercise">×</button></div><div class="workout-sets">${checks}</div></article>`;
    }).join("");
    this.renderProgress(record);
  },
  renderProgress(record) {
    const total=record?.totalSets||0,done=record?.completedSets||0,percent=total?Math.round(done/total*100):0;
    document.getElementById("workoutProgressPercent").textContent=percent+"%";
    document.getElementById("workoutProgressCount").textContent=`${done} of ${total} sets`;
    document.getElementById("workoutProgressBar").style.width=percent+"%";
    document.getElementById("workoutProgressStatus").textContent=record?.completed?"Workout completed":total?"In progress":"Not started";
  },
  refreshDashboard() {
    App.updateDashboard();
    if(document.getElementById("page-history").classList.contains("active"))App.renderHistory();
  },
  escape(value) {return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
};
