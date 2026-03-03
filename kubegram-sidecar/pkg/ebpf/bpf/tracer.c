//go:build ignore

// SPDX-License-Identifier: GPL-2.0
// kubegram-sidecar eBPF TC traffic tracer
//
// Attaches to TC (Traffic Control) ingress and egress hooks on a pod's
// network interface to capture packet metadata and first 64 bytes of
// payload for L7 HTTP header parsing in userspace.

#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/ipv6.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include <linux/pkt_cls.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

#define PAYLOAD_SIZE 64
#define DIRECTION_INGRESS 0
#define DIRECTION_EGRESS  1

// Event written to the ring buffer for each captured packet
struct packet_event {
    __u32 src_ip;
    __u32 dst_ip;
    __u16 src_port;
    __u16 dst_port;
    __u32 bytes;
    __u8  direction;
    __u8  proto;
    __u8  payload[PAYLOAD_SIZE];
    __u8  payload_len; // actual bytes captured (≤ PAYLOAD_SIZE)
};

// Ring buffer map: events are consumed by userspace
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 24); // 16 MB ring buffer
} events SEC(".maps");

// Per-CPU scratch map to build events without stack overflow
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, struct packet_event);
} scratch SEC(".maps");

static __always_inline int process_packet(struct __sk_buff *skb, __u8 direction)
{
    void *data     = (void *)(long)skb->data;
    void *data_end = (void *)(long)skb->data_end;

    // Parse Ethernet header
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return TC_ACT_OK;

    __u16 eth_proto = bpf_ntohs(eth->h_proto);
    __u32 src_ip = 0, dst_ip = 0;
    __u16 src_port = 0, dst_port = 0;
    __u8  proto = 0;
    __u32 l4_offset = 0;

    // IPv4 only (IPv6 support can be added later)
    if (eth_proto != ETH_P_IP)
        return TC_ACT_OK;

    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return TC_ACT_OK;

    src_ip = ip->saddr;
    dst_ip = ip->daddr;
    proto  = ip->protocol;
    l4_offset = sizeof(struct ethhdr) + (ip->ihl * 4);

    // TCP only: extract ports and payload
    if (proto != IPPROTO_TCP)
        return TC_ACT_OK;

    struct tcphdr *tcp = data + l4_offset;
    if ((void *)(tcp + 1) > data_end)
        return TC_ACT_OK;

    src_port = bpf_ntohs(tcp->source);
    dst_port = bpf_ntohs(tcp->dest);

    __u32 payload_offset = l4_offset + (tcp->doff * 4);
    __u32 pkt_size       = skb->len;

    // Reserve event in ring buffer
    struct packet_event *ev = bpf_ringbuf_reserve(&events, sizeof(struct packet_event), 0);
    if (!ev)
        return TC_ACT_OK;

    ev->src_ip    = src_ip;
    ev->dst_ip    = dst_ip;
    ev->src_port  = src_port;
    ev->dst_port  = dst_port;
    ev->bytes     = pkt_size;
    ev->direction = direction;
    ev->proto     = proto;
    ev->payload_len = 0;

    // Capture first PAYLOAD_SIZE bytes of TCP payload for HTTP parsing
    __u32 payload_avail = pkt_size > payload_offset ? pkt_size - payload_offset : 0;
    __u8 cap = payload_avail < PAYLOAD_SIZE ? (__u8)payload_avail : PAYLOAD_SIZE;

    if (cap > 0 && payload_offset + cap <= pkt_size) {
        if (bpf_skb_load_bytes(skb, payload_offset, ev->payload, cap) == 0)
            ev->payload_len = cap;
    }

    bpf_ringbuf_submit(ev, 0);
    return TC_ACT_OK;
}

SEC("tc/ingress")
int tc_ingress(struct __sk_buff *skb)
{
    return process_packet(skb, DIRECTION_INGRESS);
}

SEC("tc/egress")
int tc_egress(struct __sk_buff *skb)
{
    return process_packet(skb, DIRECTION_EGRESS);
}

char __license[] SEC("license") = "GPL";
