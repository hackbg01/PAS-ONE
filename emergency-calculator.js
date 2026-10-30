// Emergency Cost Calculator
class EmergencyCostCalculator {
  constructor() {
    this.config = window.APP_CONFIG;
  }

  calculateCost(lat, lng, isRegistered = false) {
    const distance = this.calculateDistance(
      this.config.BASE_LOCATION_LAT, this.config.BASE_LOCATION_LNG, lat, lng
    );
    const now = new Date(), hour = now.getHours();
    const isNormalHours = hour >= this.config.NORMAL_HOURS_START && hour < this.config.NORMAL_HOURS_END;
    
    let visitFee = 0;
    if (!isRegistered) visitFee = this.config.GUEST_VISIT_FEE;
    else if (!isNormalHours) visitFee = this.config.OFF_HOURS_VISIT_FEE;
    
    let distanceFee = 0;
    if (distance > this.config.FREE_RADIUS_KM) {
      distanceFee = (distance - this.config.FREE_RADIUS_KM) * this.config.DISTANCE_OVERAGE_FEE;
    }
    
    return {
      distance: parseFloat(distance.toFixed(2)),
      visitFee, distanceFee,
      totalEstimate: visitFee + distanceFee,
      isNormalHours
    };
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371, dLat = (lat2-lat1)*(Math.PI/180), dLng = (lng2-lng1)*(Math.PI/180);
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*(Math.PI/180))*Math.cos(lat2*(Math.PI/180))*Math.sin(dLng/2)*Math.sin(dLng/2);
    const c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    return R*c;
  }
}

window.emergencyCalculator = new EmergencyCostCalculator();
