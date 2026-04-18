import { useState, useCallback, useEffect, useMemo } from 'react';
import type { TestPacket } from '../types';

const STORAGE_KEY = 'litmus-user-packets';

function loadUserPackets(): TestPacket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUserPackets(packets: TestPacket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packets));
}

export function usePackets() {
  // User-created packets: persisted in localStorage, always visible
  const [userPackets, setUserPackets] = useState<TestPacket[]>(loadUserPackets);
  // Demo packets: transient, swapped when demo context changes
  const [demoPackets, setDemoPackets] = useState<TestPacket[]>([]);
  const [activePacketIds, setActivePacketIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    saveUserPackets(userPackets);
  }, [userPackets]);

  // All visible packets = user packets + current demo packets
  const visiblePackets = useMemo(
    () => [...userPackets, ...demoPackets],
    [userPackets, demoPackets]
  );

  const addPacket = useCallback((packet: TestPacket) => {
    setUserPackets((prev) => [...prev, packet]);
    setActivePacketIds((prev) => new Set([...prev, packet.id]));
  }, []);

  const updatePacket = useCallback((id: string, updates: Partial<TestPacket>) => {
    setUserPackets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    setDemoPackets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePacket = useCallback((id: string) => {
    setUserPackets((prev) => prev.filter((p) => p.id !== id));
    setDemoPackets((prev) => prev.filter((p) => p.id !== id));
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

  const loadDemoPackets = useCallback((packets: TestPacket[]) => {
    setDemoPackets(packets);
    // Activate demo packets + keep user packets that were already active
    setActivePacketIds((prev) => {
      const demoIds = new Set(packets.map((p) => p.id));
      const keptUserIds = [...prev].filter((id) => !demoIds.has(id));
      return new Set([...keptUserIds, ...packets.map((p) => p.id)]);
    });
  }, []);

  const clearDemoPackets = useCallback(() => {
    setDemoPackets([]);
    // Keep only user packet activations
    setActivePacketIds((prev) => {
      const userIds = new Set(userPackets.map((p) => p.id));
      return new Set([...prev].filter((id) => userIds.has(id)));
    });
  }, [userPackets]);

  const activePackets = visiblePackets.filter((p) => activePacketIds.has(p.id));

  const userPacketIds = new Set(userPackets.map((p) => p.id));

  return {
    packets: visiblePackets,
    userPacketIds,
    activePackets,
    activePacketIds,
    addPacket,
    updatePacket,
    deletePacket,
    togglePacket,
    loadDemoPackets,
    clearDemoPackets,
  };
}
