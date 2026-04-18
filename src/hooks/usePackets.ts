import { useState, useCallback, useEffect } from 'react';
import type { TestPacket } from '../types';

const STORAGE_KEY = 'litmus-packets';

function loadPackets(): TestPacket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePackets(packets: TestPacket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packets));
}

export function usePackets() {
  const [packets, setPackets] = useState<TestPacket[]>(loadPackets);
  const [activePacketIds, setActivePacketIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    savePackets(packets);
  }, [packets]);

  const addPacket = useCallback((packet: TestPacket) => {
    setPackets((prev) => [...prev, packet]);
  }, []);

  const updatePacket = useCallback((id: string, updates: Partial<TestPacket>) => {
    setPackets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePacket = useCallback((id: string) => {
    setPackets((prev) => prev.filter((p) => p.id !== id));
    setActivePacketIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const togglePacket = useCallback((id: string) => {
    setActivePacketIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setActivePackets = useCallback((ids: string[]) => {
    setActivePacketIds(new Set(ids));
  }, []);

  const loadDemoPackets = useCallback((demoPackets: TestPacket[]) => {
    setPackets((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newPackets = demoPackets.filter((p) => !existingIds.has(p.id));
      return [...prev, ...newPackets];
    });
    setActivePacketIds(new Set(demoPackets.map((p) => p.id)));
  }, []);

  const activePackets = packets.filter((p) => activePacketIds.has(p.id));

  return {
    packets,
    activePackets,
    activePacketIds,
    addPacket,
    updatePacket,
    deletePacket,
    togglePacket,
    setActivePackets,
    loadDemoPackets,
  };
}
