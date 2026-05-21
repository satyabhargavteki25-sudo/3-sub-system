# 🛰️ CubeSat Prototype  
### Multi-Subsystem Satellite Testing and Communication System

![Platform](https://img.shields.io/badge/platform-ESP32-blue)
![ESP8266](https://img.shields.io/badge/ESP8266-supported-orange)
![Python](https://img.shields.io/badge/python-3.x-green)
![Arduino IDE](https://img.shields.io/badge/Arduino_IDE-2.x-00979D)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC)
![License](https://img.shields.io/badge/license-MIT-yellow)

**Project Lead:** TEKI SATYA BHARGAV  
**Institution:** VIGNAN UNIVERSITY  
**Recognition:** Top 10 – AP Space Summit 2026  

---

# Overview

This project presents a CubeSat-inspired prototype developed to explore environmental sensing, communication relay, and RF message handling using embedded systems.

The project combines multiple independent subsystems into a unified architecture capable of monitoring environmental data, relaying messages, and interacting with a local ground station.

Communication is implemented using **ESP-NOW**, enabling peer-to-peer communication without requiring internet access or a wireless router.

---

# Problem Statement

Small satellite and student aerospace projects often encounter challenges such as:

- Limited communication infrastructure
- Difficulty monitoring onboard conditions
- Limited testing environments
- Complex integration between sensing and communication systems

This project explores a modular approach to demonstrating these concepts using low-cost hardware and offline communication.

---

# Objectives

- Design a modular CubeSat prototype
- Demonstrate offline communication
- Monitor environmental parameters
- Visualize CubeSat orientation
- Explore RF broadcast handling
- Build a scalable subsystem architecture

---

# Features

✅ Multi-subsystem architecture  
✅ ESP-NOW wireless communication  
✅ Real-time environmental monitoring  
✅ Orientation tracking  
✅ Dashboard visualization  
✅ Communication relay demonstration  
✅ RF broadcast handling  
✅ Modular and expandable design  

---

# 📡 System Architecture

| Subsystem | Function |
|----------|----------|
| Sensor Payload & Ground Station | Collects and visualizes sensor data |
| Satellite Gateway Relay | Demonstrates message forwarding |
| RF Broadcast Listener | Receives and processes transmitted data |

---

# 🧰 Hardware Components

| Component | Purpose |
|----------|---------|
| NodeMCU ESP8266 ×3 | CubeSat + Ground Station + Listener |
| ESP32 ×2 | Communication relay |
| MPU6050 | Orientation sensing |
| BMP180 | Temperature and pressure |
| MQ135 | Air quality monitoring |
| Simulated Thruster Interface | Manual dashboard simulation |

---

# ⚙️ Subsystem 1 — Sensor Payload & Ground Station

Functions:

- Temperature monitoring
- Pressure monitoring
- Air quality measurement
- Orientation tracking

Orientation representation:

```text
Roll
Pitch
Yaw
```

Sensor information is transferred to the ground station dashboard for monitoring.

---

# 🔄 Subsystem 2 — Satellite Gateway Relay

Demonstration flow:

```text
Phone A
 ↓
ESP32 Node 1
 ↓
CubeSat
 ↓
ESP32 Node 2
 ↓
Phone B
```

Purpose:

- Message relay
- Communication demonstration
- Offline connectivity testing

---

# 📻 Subsystem 3 — RF Broadcast Listener

Capabilities:

- Receive broadcast signals
- Process selected messages
- Generate multiple encoded outputs

Examples:

```text
Base64
ROT13
Atbash
Additional encoding formats
```

---

# 🧠 Design Decisions

## Manual Thruster Simulation

Thrusters are simulated and controlled manually.

This allows safe experimentation without requiring autonomous navigation hardware.

---

## ESP-NOW Communication

Advantages:

- Low latency
- Direct device communication
- No router required
- Offline operation

---

# 🖥 Dashboard

Displays:

- Temperature
- Pressure
- Air quality
- Orientation
- CubeSat movement

Suggested software:

```text
Python
Matplotlib
PySerial
PyOpenGL
PyQt
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/satyabhargavteki25-sudo/3-sub-system.git

cd 3-sub-system
```

---

## Install Libraries

Arduino IDE:

```text
ESP8266 Board Package

ESP32 Board Package

ESP-NOW

Adafruit MPU6050

Adafruit BMP180

MQ135 Library
```

---

## Upload Firmware

```text
subsystem1_cubesat_sensor/
→ CubeSat Controller

subsystem1_groundstation/
→ Ground Station

subsystem2_gateway/
→ Relay Nodes

subsystem3_broadcast_listener/
→ Listener
```

---

## Run Dashboard

```bash
cd dashboard

python dashboard.py
```

---

# 📊 Demonstrated Capabilities

- Multi-board communication
- Sensor monitoring
- Dashboard interaction
- Orientation visualization
- Message relay
- RF message handling

---

# 💰 Estimated Cost

| Component | Quantity |
|----------|----------|
| ESP8266 | 3 |
| ESP32 | 2 |
| Sensors | Multiple |

Approximate total cost depends on sourcing and availability.

---

# ⚠ Current Scope

Current implementation:

```text
Simulated thrusters

Short-range communication

No onboard vision

Encoding-focused experiments
```

---

# 🔮 Future Improvements

- Camera integration
- Sensor fusion
- Long-range RF modules
- Data logging
- Expanded dashboard analytics

---

# 📂 Repository Structure

```text
3-sub-system/

README.md

dashboard/

subsystem1_cubesat_sensor/

subsystem1_groundstation/

subsystem2_gateway/

subsystem3_broadcast_listener/
```

---

# 👥 Contributors

TEKI SATYA BHARGAV  
VIGNAN UNIVERSITY

---

# 🙏 Acknowledgements

- Espressif Systems
- NASA educational resources
- Open-source embedded communities
- Student satellite learning initiatives

---

# 📄 License

MIT License

---

# 📬 Contact

Project Lead: TEKI SATYA BHARGAV  
Institution: VIGNAN UNIVERSITY  

GitHub:

https://github.com/satyabhargavteki25-sudo/3-sub-system

---

### Built as a student engineering project for experimentation, learning, and communication system exploration 🛰️
