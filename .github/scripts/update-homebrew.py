#!/usr/bin/env python3
"""Generates Formula/kubegram.rb from environment variables set by the workflow."""
import os

v    = os.environ["VERSION_NUM"]
base = os.environ["BASE"]
da   = os.environ["DARWIN_AMD64"]
darm = os.environ["DARWIN_ARM64"]
la   = os.environ["LINUX_AMD64"]
larm = os.environ["LINUX_ARM64"]

formula = f"""\
class Kubegram < Formula
  desc "AI-driven visual Kubernetes infrastructure CLI"
  homepage "https://www.kubegram.com"
  version "{v}"
  license "Apache-2.0"

  on_macos do
    on_arm do
      url "{base}/kubegram_{v}_darwin_arm64.tar.gz"
      sha256 "{darm}"
    end
    on_intel do
      url "{base}/kubegram_{v}_darwin_amd64.tar.gz"
      sha256 "{da}"
    end
  end

  on_linux do
    on_arm do
      url "{base}/kubegram_{v}_linux_arm64.tar.gz"
      sha256 "{larm}"
    end
    on_intel do
      url "{base}/kubegram_{v}_linux_amd64.tar.gz"
      sha256 "{la}"
    end
  end

  def install
    bin.install "kubegram"
  end

  test do
    system "\#{bin}/kubegram", "version"
  end
end
"""

output = os.environ.get("OUTPUT_FILE", "tap/Formula/kubegram.rb")
os.makedirs(os.path.dirname(output), exist_ok=True)
with open(output, "w") as f:
    f.write(formula)

print(f"Written formula for kubegram {v} to {output}")
