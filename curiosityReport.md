# Network Related Protocols

Network protocols are sets of rules that determine how data gets transmitted between different devices. They operate across multiple layers of communication to ensure networks function properly. There is no fixed number of protocols, since new ones are created to meet evolving needs. However, many established protocols are widely used today — such as **TCP, HTTP, TLS, SSH**, and more. These protocols are typically designed and standardized by organizations like the **Institute of Electrical and Electronics Engineers (IEEE)** and the **Internet Engineering Task Force (IETF)**.

Each protocol has a specific function within its layer of operation, but most can be categorized into three main functionality groups:

- **Communication**
- **Network Management**
- **Security**

---

## Communication Protocols

Communication protocols enable the basic transfer of data between devices. For instance, the **Transmission Control Protocol (TCP)** and the **Internet Protocol (IP)** are foundational to internet communication.

TCP operates in the Transport Layer (OSI Model) and supports reliable connections through the well-known **three-way handshake**:

1. The client sends a **SYN** (synchronize) packet.
2. The server responds with **SYN-ACK** (synchronize-acknowledge).
3. The client replies with a final **ACK** (acknowledge) to establish the connection.

TCP splits transmitted data into **segments** to provide:

- Error detection and recovery
- Ordered delivery
- Flow control

Closing a TCP connection includes a similar process using the **FIN** flag in a **four-way handshake**.

While TCP ensures reliable delivery, **IP** handles network routing. It adds **source and destination IP addresses** so data can traverse multiple networks to reach the correct device. Other protocols such as the **User Datagram Protocol (UDP)** prioritize speed over reliability when loss-tolerance is acceptable (e.g., gaming, streaming).

---

## Network Management Protocols

Network Management protocols focus on monitoring and maintaining network infrastructure.

Examples include:

- **Simple Network Management Protocol (SNMP)**
- **Internet Control Message Protocol (ICMP)**
- **NETCONF** (modern configuration and management)

According to GeeksforGeeks, SNMP:

> “…is a widely used protocol for network management that provides a standardized framework for monitoring and managing network devices such as routers, switches, servers, printers, firewalls, and load balancers.”

SNMP operates at the **Application Layer** and involves:

- A **Network Management Station (NMS)** that requests data
- A **software agent** on each device that collects performance information in a **Management Information Base (MIB)**

SNMP primarily uses a **polling model** (manager requests → device responds).

Modern telemetry systems shift to a **push model**, where devices automatically stream metrics to a **collector** (e.g., Grafana) without constant polling. This improves scalability and real-time insight into performance.

---

## Security Protocols

Security protocols ensure data remains:

- **Confidential** (protected from unauthorized access)
- **Authentic** (sender and receiver identities verified)
- **Untampered** (integrity preserved)

Historically, **Secure Sockets Layer (SSL)** provided encryption over the web, but it relied on outdated algorithms like **SHA-1**, which is no longer secure.

Its modern successor, **Transport Layer Security (TLS)**, uses stronger methods such as:

- **SHA-256 hashing** for authentication and integrity
- Digital certificates for trust validation

TLS protects both **data in motion** (internet communication) and **data at rest** (stored information).

---

## References

- https://www.geeksforgeeks.org/
- https://www.cloudflare.com/

> Note: Each of these sites contains numerous resources on the specific protocols described here. Though not directly quoted, the main ideas and concepts were taken from a careful reading of the resources.
