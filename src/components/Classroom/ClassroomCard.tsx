import { useState } from 'react';
import { MapPin, Users, Edit3, Trash2, Plus, Check } from 'lucide-react';
import type { Classroom } from '@/types';
import { useAppStore } from '@/store';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { equipmentOptions } from '@/data/mockData';

interface ClassroomCardProps {
  classroom: Classroom;
}

export default function ClassroomCard({ classroom }: ClassroomCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(classroom);
  const { updateClassroom, deleteClassroom } = useAppStore();

  function handleSave() {
    updateClassroom(classroom.id, editForm);
    setShowEditModal(false);
  }

  function handleDelete() {
    if (confirm('确定要删除这个教室吗？')) {
      deleteClassroom(classroom.id);
    }
  }

  function toggleEquipment(equip: string) {
    setEditForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equip)
        ? prev.equipment.filter((e) => e !== equip)
        : [...prev.equipment, equip],
    }));
  }

  return (
    <>
      <div className="card h-full flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold font-serif text-primary">{classroom.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                {classroom.location}
              </div>
            </div>
            <StatusBadge status={classroom.status === 'active' ? 'approved' : 'pending'} />
          </div>
        </div>
        <div className="p-4 flex-1">
          <div className="flex items-center gap-2 mb-4 text-gray-600">
            <Users className="w-5 h-5 text-primary" />
            <span>容纳 {classroom.capacity} 人</span>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">设备配置</h5>
            <div className="flex flex-wrap gap-1.5">
              {classroom.equipment.map((equip) => (
                <span
                  key={equip}
                  className="text-xs px-2 py-1 bg-primary/5 text-primary rounded-md"
                >
                  {equip}
                </span>
              ))}
              {classroom.equipment.length === 0 && (
                <span className="text-xs text-gray-400">暂无设备</span>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditForm(classroom);
              setShowEditModal(true);
            }}
          >
            <Edit3 className="w-4 h-4 mr-1" />
            编辑
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            删除
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑教室信息"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教室名称</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">容纳人数</label>
              <input
                type="number"
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value as 'active' | 'maintenance' })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="active">正常使用</option>
                <option value="maintenance">维护中</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">设备配置</label>
            <div className="grid grid-cols-3 gap-2">
              {equipmentOptions.map((equip) => {
                const selected = editForm.equipment.includes(equip);
                return (
                  <button
                    key={equip}
                    type="button"
                    onClick={() => toggleEquipment(equip)}
                    className={`flex items-center justify-between p-2 rounded-md border transition-all ${
                      selected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    <span className="text-sm">{equip}</span>
                    {selected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function AddClassroomButton() {
  const [showModal, setShowModal] = useState(false);
  const { addClassroom } = useAppStore();
  const [form, setForm] = useState<Omit<Classroom, 'id'>>({
    name: '',
    capacity: 50,
    equipment: [],
    location: '',
    status: 'active',
  });

  function handleSubmit() {
    if (!form.name || !form.location) {
      alert('请填写完整信息');
      return;
    }
    addClassroom(form);
    setShowModal(false);
    setForm({
      name: '',
      capacity: 50,
      equipment: [],
      location: '',
      status: 'active',
    });
  }

  function toggleEquipment(equip: string) {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equip)
        ? prev.equipment.filter((e) => e !== equip)
        : [...prev.equipment, equip],
    }));
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
      >
        <Plus className="w-4 h-4 mr-1" />
        添加教室
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="添加新教室"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教室名称</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：模拟法庭一号庭"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="如：法学院A座101室"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">容纳人数</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as 'active' | 'maintenance' })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="active">正常使用</option>
                <option value="maintenance">维护中</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">设备配置</label>
            <div className="grid grid-cols-3 gap-2">
              {equipmentOptions.map((equip) => {
                const selected = form.equipment.includes(equip);
                return (
                  <button
                    key={equip}
                    type="button"
                    onClick={() => toggleEquipment(equip)}
                    className={`flex items-center justify-between p-2 rounded-md border transition-all ${
                      selected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    <span className="text-sm">{equip}</span>
                    {selected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>添加</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
