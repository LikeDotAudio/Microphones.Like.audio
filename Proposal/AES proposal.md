Proposal Concept: An AES Standard for Microphone Directivity & Response Reporting
A community database and structured reporting format for microphone characteristics, extending the precedent set by AES69 (SOFA).

The Problem
Production tooling is rapidly moving toward systems that understand where a microphone is and how it actually hears — location-based automixing, contextual health/diagnostic monitoring, spatial and immersive workflows. Every one of these systems depends on the same foundational input: a microphone's real directivity (frequency-dependent polar response) and frequency response, in a precise, structured, machine-readable form.

That data effectively already exists — manufacturers measure it during development — but it's only published as static charts embedded in datasheet PDFs, in inconsistent formats, at inconsistent resolution, with no standardized measurement/reporting convention. Every team building a context-aware system today is independently re-digitizing the same charts from the same handful of manufacturers, an industry-wide redundancy with no benefit to anyone, including the manufacturers.

The Proposal
A new AES-maintained standard defining:

A structured reporting convention for microphone directivity (frequency-dependent polar attenuation) and on-axis frequency response, including the physical reference-point/acoustic-center metadata needed to relate a data-sheet measurement to an installed microphone's true acoustic position.
A public, community-maintained database of conforming data, analogous to sofaconventions.org — a shared, canonical source rather than dozens of redundant private catalogs.
This is not a proposal to build a new format from scratch. AES69 (SOFA) already provides the spatial-data container and already defines conventions for source directivity — the technical foundation for representing exactly this kind of data already exists within AES's own standards portfolio. What's missing is a convention profiled specifically for microphones (receivers, not sources) plus a mechanism for structured contribution and industry buy-in. This is a comparatively narrow, well-precedented extension, not a new undertaking.

Why AES, Why Now
Convener credibility. No single company can ask its competitors to publish comparable data; a neutral, respected standards body can. AES has already proven this model works via SOFA's adoption across HRTF/room-acoustics research.
Precedent for the adoption dynamic. Manufacturers who won't respond to an individual data request will often participate once it's a shared, credibility-lending industry standard — the calculus shifts from "disclosing IP" to "not being the outlier who declined."
Timing. Location-aware and context-aware production tooling is moving from research curiosity to shipping product now. A standard that exists before the ecosystem fragments into incompatible proprietary formats is far more valuable than one that arrives after.
Proposed Scope (v1)
Frequency-dependent polar attenuation (a small, fixed set of standard frequency bands and angles, for cross-manufacturer comparability)
On-axis frequency response
Reference-point / acoustic-center offset geometry
Measurement-condition metadata (so published data is comparable, not just present)
Explicitly out of scope for v1: mandating changes to manufacturers' internal measurement processes, or requesting raw/proprietary measurement data — only a standardized reporting format for data manufacturers already generate.
The Ask
This is a concept pitch, not a finished proposal. What's being requested at this stage:

Gauge interest within the relevant AES standards committee / working group structure
Identify whether this fits as a new AES69/SOFA convention or warrants a standalone standard
Explore an initial workshop session or convention paper to build community awareness and early manufacturer interest