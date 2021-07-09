bpmn-engine
===========

[![Project Status: Active - The project has reached a stable, usable state and is being actively developed.](http://www.repostatus.org/badges/latest/active.svg)](http://www.repostatus.org/#active)

[![Build Status](https://travis-ci.org/paed01/bpmn-engine.svg?branch=develop)](https://travis-ci.org/paed01/bpmn-engine)[![Build status](https://ci.appveyor.com/api/projects/status/670n39fivq1g3nu5/branch/develop?svg=true)](https://ci.appveyor.com/project/paed01/bpmn-engine/branch/develop)[![Coverage Status](https://coveralls.io/repos/github/paed01/bpmn-engine/badge.svg?branch=develop)](https://coveralls.io/github/paed01/bpmn-engine?branch=develop)

## Introduction
BPMN 2.0 execution engine. Open source javascript workflow engine.

## Table of Contents
- [Supported elements](#supported-elements)
- [Process modeller](#process-modeller)
- [Debug](#debug)
- [Acknowledgments](#acknowledgments)
- [Changelog](/Changelog.md)

### Documentation
- [API](/API.md)
- [Examples](/docs/Examples.md)
- [Extensions](/docs/Extensions.md)

# Supported elements

The following elements are tested and supported.

- [Definition](/docs/Definition.md)
- Process
- Lane
- Flows:
  - Sequence: javascript- and expression conditions
  - Message
- Events
  - [Start](/docs/StartEvent.md)
  - End
  - Error
    - Boundary
  - Message
    - Start
    - Intermediate
  - Timer: with duration as ISO_8601
    - Intermediate
    - Boundary Interupting
    - Boundary Non-interupting
- Tasks
  - Manual: needs signal
  - [Loop](/docs/TaskLoop.md): Sequential and parallell
    - Cardinality, integer or expression
    - Condition, script or expression
    - Collection (extension expression)
  - [Service](/docs/ServiceTask.md)
  - SubProcess
  - Script: javascript only
  - Task: completes immediately
  - User: needs signal
  - Send
  - Receive
- [Gateways](/docs/Gateways.md)
  - Exclusive
  - Inclusive
  - Parallel: join and fork
- Form

# Process modeller

The processes are modelled using [Camunda modeler](https://camunda.org/bpmn/tool/).

![Mother of all](https://raw.github.com/paed01/bpmn-engine/master/images/mother-of-all.png)

# Debug

The module uses [debug](github.com/visionmedia/debug) so run with environment variable `DEBUG=bpmn-engine:*`.

# Acknowledgments

The **bpmn-engine** resides upon the excellent library [bpmn-io/bpmn-moddle](https://github.com/bpmn-io/bpmn-moddle) developed by [bpmn.io](http://bpmn.io/)
