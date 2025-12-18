import React, { useEffect, useState } from 'react';
import { clientService } from '../../services/clientService';
import { ScheduleEvent, CreateScheduleEventDTO } from '../../types';
import { ChevronLeft, ChevronRight, X, Users, Plus, Edit2, Trash2 } from 'lucide-react';

const SchedulePage: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Editing / Creating State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null); // Null means creating new
  const [formData, setFormData] = useState<CreateScheduleEventDTO>({
    title: '',
    start: '',
    end: '',
    type: 'meeting',
    team: 'sales',
    description: ''
  });

  const loadEvents = async () => {
    try {
      const data = await clientService.getScheduleEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
      alert('スケジュール取得に失敗しました。サーバー起動を確認してください。');
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Calendar Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentMonth);
  const calendarCells = [];
  
  // Empty cells for padding
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/30 border border-gray-100"></div>);
  }

  // Day cells
  for (let d = 1; d <= days; d++) {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d).toDateString();
    const dayEvents = events.filter(e => new Date(e.start).toDateString() === dateStr);
    
    calendarCells.push(
      <div 
        key={d} 
        onClick={() => {
          setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
          setIsDayModalOpen(true);
        }}
        className="h-32 bg-white border border-gray-100 p-2 hover:bg-brand-50 cursor-pointer transition-colors relative group"
      >
        <div className="flex justify-between items-start">
          <span className={`text-sm font-medium ${dayEvents.length > 0 ? 'text-brand-600' : 'text-slate-400'}`}>{d}</span>
          <button className="opacity-0 group-hover:opacity-100 text-brand-400 hover:text-brand-600 transition-opacity">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
          {dayEvents.map(e => (
            <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate
              ${e.team === 'sales' ? 'bg-blue-100 text-blue-700' : 
                e.team === 'director' ? 'bg-purple-100 text-purple-700' : 
                'bg-orange-100 text-orange-700'}`
            }>
              {e.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const selectedDayEvents = selectedDate 
    ? events.filter(e => new Date(e.start).toDateString() === selectedDate.toDateString())
    : [];

  // --- CRUD Handlers ---

  const openCreateModal = () => {
    // Default start time: Selected date at 10:00, or today at 10:00
    const baseDate = selectedDate || new Date();
    baseDate.setHours(10, 0, 0, 0);
    const startDateStr = new Date(baseDate.getTime() - (baseDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    const endDateStr = new Date(baseDate.getTime() + 3600000 - (baseDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    setEditingEvent(null);
    setFormData({
      title: '',
      start: startDateStr,
      end: endDateStr,
      type: 'meeting',
      team: 'sales',
      description: ''
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (event: ScheduleEvent) => {
    const startDateStr = new Date(new Date(event.start).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    const endDateStr = new Date(new Date(event.end).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    setEditingEvent(event);
    setFormData({
      title: event.title,
      start: startDateStr,
      end: endDateStr,
      type: event.type,
      team: event.team,
      description: event.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('この予定を削除してもよろしいですか？')) {
      try {
        await clientService.deleteScheduleEvent(id);
        await loadEvents();
      } catch (err) {
        console.error(err);
        alert('削除に失敗しました');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert local datetime-local string back to ISO
      const startIso = new Date(formData.start).toISOString();
      const endIso = new Date(formData.end).toISOString();
      const payload = { ...formData, start: startIso, end: endIso };

      if (editingEvent) {
        await clientService.updateScheduleEvent(editingEvent.id, payload);
      } else {
        await clientService.createScheduleEvent(payload);
      }
      setIsEditModalOpen(false);
      await loadEvents();
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">チームスケジュール</h1>
          <p className="text-sm text-slate-500">他チームの動きや重要期限を確認・編集できます</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => {
                setSelectedDate(new Date()); // Default to today if adding from top
                openCreateModal();
             }}
             className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
           >
             <Plus className="w-4 h-4" />
             予定を追加
           </button>
           <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-lg">
             <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
             <span className="text-lg font-bold text-slate-800 w-32 text-center">
               {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
             </span>
             <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
           </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
           {['日', '月', '火', '水', '木', '金', '土'].map(d => (
             <div key={d} className="bg-slate-100 p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
               {d}
             </div>
           ))}
           {calendarCells}
        </div>
      </div>

      {/* Day Details Modal */}
      {isDayModalOpen && selectedDate && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="bg-brand-500 p-4 flex justify-between items-center text-white flex-shrink-0">
              <h3 className="font-bold text-lg">
                {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 の予定
              </h3>
              <div className="flex gap-2">
                 <button 
                   onClick={openCreateModal}
                   className="bg-white/20 hover:bg-white/30 p-1.5 rounded text-white transition-colors"
                   title="予定を追加"
                 >
                   <Plus className="w-4 h-4" />
                 </button>
                 <button onClick={() => setIsDayModalOpen(false)} className="hover:bg-brand-600 p-1 rounded"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                  <p>予定はありません</p>
                  <button onClick={openCreateModal} className="text-brand-600 text-sm hover:underline">
                    新しい予定を追加する
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDayEvents.map(e => (
                    <div key={e.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 group">
                      <div className="flex flex-col items-center min-w-[60px] pt-1">
                        <span className="text-sm font-bold text-slate-700">
                          {new Date(e.start).getHours()}:{String(new Date(e.start).getMinutes()).padStart(2, '0')}
                        </span>
                        <div className="h-full w-0.5 bg-gray-100 mt-2"></div>
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                                  e.type === 'meeting' ? 'bg-blue-100 text-blue-700' : 
                                  e.type === 'deadline' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {e.type}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {e.team}
                                </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => openEditModal(e)}
                                 className="text-slate-400 hover:text-brand-600"
                               >
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                 onClick={() => handleDelete(e.id)}
                                 className="text-slate-400 hover:text-red-600"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         </div>
                         <h4 className="font-bold text-slate-800">{e.title}</h4>
                         {e.description && <p className="text-sm text-slate-500 mt-1">{e.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal (Top Layer) */}
      {isEditModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800">
                  {editingEvent ? '予定を編集' : '新しい予定を作成'}
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">タイトル *</label>
                   <input 
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                     value={formData.title}
                     onChange={e => setFormData({...formData, title: e.target.value})}
                     placeholder="例：定例MTG"
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">開始日時 *</label>
                      <input 
                        required
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        value={formData.start}
                        onChange={e => setFormData({...formData, start: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">終了日時 *</label>
                      <input 
                        required
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        value={formData.end}
                        onChange={e => setFormData({...formData, end: e.target.value})}
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">タイプ</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                      >
                        <option value="meeting">ミーティング</option>
                        <option value="deadline">期限・締切</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">チーム</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
                        value={formData.team}
                        onChange={e => setFormData({...formData, team: e.target.value as any})}
                      >
                        <option value="sales">Sales (営業)</option>
                        <option value="director">Director (進行)</option>
                        <option value="creative">Creative (制作)</option>
                      </select>
                    </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">詳細</label>
                   <textarea 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[80px]"
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     placeholder="メモや共有事項など..."
                   />
                 </div>

                 <div className="pt-2 flex justify-end gap-3">
                   <button 
                     type="button" 
                     onClick={() => setIsEditModalOpen(false)}
                     className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-100 rounded-lg"
                   >
                     キャンセル
                   </button>
                   <button 
                     type="submit" 
                     className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                   >
                     保存する
                   </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
